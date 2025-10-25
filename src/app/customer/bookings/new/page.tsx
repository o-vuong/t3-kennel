"use client";

import { BookingStatus } from "@prisma/client";
import { ArrowLeft, Calendar, DollarSign, Loader2, MapPin } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { DEFAULT_HOME_PATH } from "~/lib/auth/roles";
import { api, type RouterInputs } from "~/trpc/react";

type BookingFormState = {
	petId: string;
	size: string;
	kennelId: string;
	startDate: string;
	endDate: string;
	notes: string;
};

const formatCurrency = (value: number) =>
	new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		maximumFractionDigits: 2,
	}).format(value);

const calculateNights = (start: string, end: string) => {
	if (!start || !end) return 0;
	const startDate = new Date(start);
	const endDate = new Date(end);

	if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
		return 0;
	}

	const diff = endDate.getTime() - startDate.getTime();
	const nights = Math.ceil(diff / (1000 * 60 * 60 * 24));
	return nights > 0 ? nights : 0;
};

export default function NewBookingPage() {
	const router = useRouter();
	const [formState, setFormState] = useState<BookingFormState>({
		petId: "",
		size: "",
		kennelId: "",
		startDate: "",
		endDate: "",
		notes: "",
	});
	const [error, setError] = useState<string | null>(null);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	const { data: pets, isLoading: petsLoading } = api.customer.myPets.useQuery();

	type AvailabilityInput = RouterInputs["kennels"]["available"];

	const availabilityInput = useMemo<AvailabilityInput | null>(() => {
		if (!formState.startDate || !formState.endDate) {
			return null;
		}

		const start = new Date(formState.startDate);
		const end = new Date(formState.endDate);

		if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
			return null;
		}

		if (end <= start) {
			return null;
		}

		return {
			startDate: start,
			endDate: end,
			size: formState.size ? formState.size : undefined,
		};
	}, [formState.startDate, formState.endDate, formState.size]);

	const { data: availableKennels, isFetching: kennelsLoading } =
		api.kennels.available.useQuery(availabilityInput as AvailabilityInput, {
			enabled: Boolean(availabilityInput),
		});

	const createBooking = api.bookings.create.useMutation({
		onSuccess: async () => {
			setSuccessMessage("Booking created successfully!");
			setTimeout(() => {
				router.push("/customer/bookings");
			}, 1200);
		},
		onError: (mutationError) => {
			setError(
				mutationError.message ||
					"We were unable to create your booking. Please try again."
			);
		},
	});

	const nights = useMemo(
		() => calculateNights(formState.startDate, formState.endDate),
		[formState.startDate, formState.endDate]
	);

	const selectedKennel = useMemo(() => {
		if (!availableKennels || !formState.kennelId) return null;
		return (
			availableKennels.find((kennel) => kennel.id === formState.kennelId) ??
			null
		);
	}, [availableKennels, formState.kennelId]);

	const totalCost = selectedKennel
		? Math.max(0, nights) * Number(selectedKennel.price)
		: 0;
	const deposit = totalCost * 0.5;
	const balance = totalCost - deposit;

	const handleChange =
		(field: keyof BookingFormState) =>
		(
			event: React.ChangeEvent<
				HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
			>
		) => {
			setError(null);
			setSuccessMessage(null);
			setFormState((prev) => ({
				...prev,
				[field]: event.target.value,
				...(field === "size" ? { kennelId: "" } : {}),
			}));
		};

	const handleSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		setError(null);
		setSuccessMessage(null);

		if (!formState.petId) {
			setError("Select a pet for this stay.");
			return;
		}

		if (!formState.startDate || !formState.endDate || nights <= 0) {
			setError(
				"Check-in and check-out dates must be valid and check-out must follow check-in."
			);
			return;
		}

		if (!selectedKennel) {
			setError("Select an available kennel.");
			return;
		}

		createBooking.mutate({
			data: {
				petId: formState.petId,
				kennelId: selectedKennel.id,
				startDate: new Date(formState.startDate),
				endDate: new Date(formState.endDate),
				price: Number(totalCost.toFixed(2)),
				status: BookingStatus.PENDING,
				notes: formState.notes ? formState.notes.trim() : undefined,
			},
		});
	};

	return (
		<div className="min-h-screen bg-gray-50">
			<header className="border-b bg-white shadow-sm">
				<div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
					<div className="flex items-center space-x-4">
						<Link href="/customer/home">
							<Button variant="ghost" size="sm">
								<ArrowLeft className="mr-2 h-4 w-4" />
								Back to Dashboard
							</Button>
						</Link>
						<div>
							<h1 className="font-bold text-2xl text-gray-900">New Booking</h1>
							<p className="text-gray-600 text-sm">
								Book a luxury stay for your pet
							</p>
						</div>
					</div>
					<Button
						variant="outline"
						size="sm"
						onClick={() => router.replace(DEFAULT_HOME_PATH)}
					>
						Cancel
					</Button>
				</div>
			</header>

			<main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
				<div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
					<Card className="lg:col-span-2">
						<CardHeader>
							<CardTitle>Booking Details</CardTitle>
							<CardDescription>
								Select your pet, kennel preference, and dates.
							</CardDescription>
						</CardHeader>
						<CardContent>
							<form className="space-y-6" onSubmit={handleSubmit}>
								<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
									<div className="space-y-2">
										<Label htmlFor="petId">Pet</Label>
										<select
											id="petId"
											value={formState.petId}
											onChange={handleChange("petId")}
											className="w-full rounded-md border border-gray-300 bg-white p-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
											disabled={petsLoading || (pets?.length ?? 0) === 0}
										>
											<option value="">
												{petsLoading ? "Loading pets..." : "Select a pet"}
											</option>
											{pets?.map((pet) => (
												<option key={pet.id} value={pet.id}>
													{pet.name ?? "Unnamed Pet"}
													{pet.breed ? ` (${pet.breed})` : ""}
												</option>
											))}
										</select>
									</div>

									<div className="space-y-2">
										<Label htmlFor="size">Kennel Size</Label>
										<select
											id="size"
											value={formState.size}
											onChange={handleChange("size")}
											className="w-full rounded-md border border-gray-300 bg-white p-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
										>
											<option value="">Any available size</option>
											<option value="small">Small</option>
											<option value="medium">Medium</option>
											<option value="large">Large</option>
											<option value="xlarge">XL</option>
										</select>
									</div>
								</div>

								<div className="grid grid-cols-1 gap-6 md:grid-cols-2">
									<div className="space-y-2">
										<Label htmlFor="startDate">Check-in date</Label>
										<Input
											id="startDate"
											type="date"
											value={formState.startDate}
											onChange={handleChange("startDate")}
											min={new Date().toISOString().split("T")[0]}
										/>
									</div>
									<div className="space-y-2">
										<Label htmlFor="endDate">Check-out date</Label>
										<Input
											id="endDate"
											type="date"
											value={formState.endDate}
											onChange={handleChange("endDate")}
											min={
												formState.startDate ||
												new Date().toISOString().split("T")[0]
											}
										/>
									</div>
								</div>

								<div className="space-y-2">
									<Label htmlFor="kennelId">Available kennels</Label>
									<select
										id="kennelId"
										value={formState.kennelId}
										onChange={handleChange("kennelId")}
										className="w-full rounded-md border border-gray-300 bg-white p-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
										disabled={!availabilityInput || kennelsLoading}
									>
										<option value="">
											{!availabilityInput
												? "Select dates to view availability"
												: kennelsLoading
													? "Checking availability..."
													: (availableKennels?.length ?? 0) === 0
														? "No kennels available for the selected dates"
														: "Select a kennel"}
										</option>
										{availableKennels?.map((kennel) => (
											<option key={kennel.id} value={kennel.id}>
												{kennel.name} • {kennel.size.toUpperCase()} •{" "}
												{formatCurrency(Number(kennel.price))}/night
											</option>
										))}
									</select>
								</div>

								<div className="space-y-2">
									<Label htmlFor="notes">Special instructions</Label>
									<textarea
										id="notes"
										value={formState.notes}
										onChange={handleChange("notes")}
										rows={4}
										className="w-full rounded-md border border-gray-300 p-3 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
										placeholder="Dietary requirements, medication schedule, preferred activities, or other notes for our care team."
									/>
								</div>

								{error ? (
									<div className="rounded-md border border-red-200 bg-red-50 p-3 text-red-700 text-sm">
										{error}
									</div>
								) : null}

								{successMessage ? (
									<div className="rounded-md border border-green-200 bg-green-50 p-3 text-green-700 text-sm">
										{successMessage}
									</div>
								) : null}

								<div className="flex items-center space-x-4">
									<Button
										type="submit"
										className="flex-1"
										disabled={createBooking.isPending}
									>
										{createBooking.isPending ? (
											<>
												<Loader2 className="mr-2 h-4 w-4 animate-spin" />
												Creating booking
											</>
										) : (
											<>
												<Calendar className="mr-2 h-4 w-4" />
												Create booking
											</>
										)}
									</Button>
									<Link href="/customer/bookings">
										<Button type="button" variant="outline">
											View my bookings
										</Button>
									</Link>
								</div>
							</form>
						</CardContent>
					</Card>

					<div className="space-y-6">
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center">
									<DollarSign className="mr-2 h-5 w-5" />
									Booking summary
								</CardTitle>
							</CardHeader>
							<CardContent className="space-y-4 text-sm">
								<div className="flex justify-between text-gray-600">
									<span>Stay length</span>
									<span>
										{nights > 0
											? `${nights} night${nights === 1 ? "" : "s"}`
											: "—"}
									</span>
								</div>
								<div className="flex justify-between text-gray-600">
									<span>Kennel rate</span>
									<span>
										{selectedKennel
											? `${formatCurrency(Number(selectedKennel.price))} / night`
											: "—"}
									</span>
								</div>
								<div className="flex justify-between text-gray-600">
									<span>Estimated total</span>
									<span className="font-semibold text-gray-900">
										{totalCost > 0 ? formatCurrency(totalCost) : "—"}
									</span>
								</div>
								<div className="border-t pt-3 text-gray-500 text-xs">
									A 50% deposit is required to confirm your reservation. Balance
									is collected at check-in.
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Payment breakdown</CardTitle>
							</CardHeader>
							<CardContent className="space-y-3 text-sm">
								<div className="flex justify-between">
									<span>Deposit (50%)</span>
									<span>{totalCost > 0 ? formatCurrency(deposit) : "—"}</span>
								</div>
								<div className="flex justify-between">
									<span>Balance at check-in</span>
									<span>{totalCost > 0 ? formatCurrency(balance) : "—"}</span>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle className="flex items-center">
									<MapPin className="mr-2 h-5 w-5" />
									Why pets love our kennels
								</CardTitle>
							</CardHeader>
							<CardContent>
								<ul className="space-y-2 text-gray-600 text-sm">
									<li>• Climate-controlled suites with premium bedding</li>
									<li>• Daily exercise and enrichment tailored to your pet</li>
									<li>
										• 24/7 monitoring with on-staff veterinary technicians
									</li>
									<li>• Gourmet meal plans and medication administration</li>
								</ul>
							</CardContent>
						</Card>
					</div>
				</div>
			</main>
		</div>
	);
}
