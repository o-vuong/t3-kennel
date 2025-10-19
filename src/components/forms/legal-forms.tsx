/**
 * Legal Forms Integration Component
 *
 * This component provides access to all required legal forms
 * and integrates them into the booking and registration flow.
 */

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { AlertTriangle, Check, Download, FileText, Shield } from "lucide-react";
import React, { useState } from "react";

interface LegalForm {
	id: string;
	title: string;
	description: string;
	required: boolean;
	category: "booking" | "privacy" | "emergency" | "hipaa";
	content: string;
	downloadUrl: string;
}

const legalForms: LegalForm[] = [
	{
		id: "terms-of-service",
		title: "Terms of Service",
		description:
			"Legal terms governing the use of our kennel management system",
		required: true,
		category: "booking",
		content: "", // Will load from markdown files
		downloadUrl: "/docs/legal/TERMS_OF_SERVICE.md",
	},
	{
		id: "privacy-policy",
		title: "Privacy Policy",
		description:
			"How we collect, use, and protect your personal and pet information",
		required: true,
		category: "privacy",
		content: "",
		downloadUrl: "/docs/legal/PRIVACY_POLICY.md",
	},
	{
		id: "pet-boarding-agreement",
		title: "Pet Boarding Agreement",
		description: "Comprehensive agreement for pet boarding services and care",
		required: true,
		category: "booking",
		content: "",
		downloadUrl: "/docs/legal/PET_BOARDING_AGREEMENT.md",
	},
	{
		id: "emergency-medical-authorization",
		title: "Emergency Medical Authorization",
		description:
			"Authorization for emergency veterinary care and treatment decisions",
		required: true,
		category: "emergency",
		content: "",
		downloadUrl: "/docs/legal/EMERGENCY_MEDICAL_AUTHORIZATION.md",
	},
	{
		id: "hipaa-business-associate",
		title: "HIPAA Business Associate Agreement",
		description: "Protection of pet health information under HIPAA regulations",
		required: false,
		category: "hipaa",
		content: "",
		downloadUrl: "/docs/legal/HIPAA_BUSINESS_ASSOCIATE_AGREEMENT.md",
	},
];

interface LegalFormsProps {
	context: "booking" | "registration" | "admin" | "standalone";
	onFormsAccepted?: (acceptedForms: string[]) => void;
	className?: string;
}

export function LegalForms({
	context,
	onFormsAccepted,
	className,
}: LegalFormsProps) {
	const [acceptedForms, setAcceptedForms] = useState<Set<string>>(new Set());
	const [openDialog, setOpenDialog] = useState<string | null>(null);

	// Filter forms based on context
	const relevantForms = legalForms.filter((form) => {
		switch (context) {
			case "booking":
				return form.category === "booking" || form.category === "emergency";
			case "registration":
				return form.required;
			case "admin":
				return form.category === "hipaa" || form.category === "privacy";
			case "standalone":
				return true;
			default:
				return form.required;
		}
	});

	const requiredForms = relevantForms.filter((form) => form.required);
	const allRequiredAccepted = requiredForms.every((form) =>
		acceptedForms.has(form.id),
	);

	const handleFormAcceptance = (formId: string, accepted: boolean) => {
		const newAcceptedForms = new Set(acceptedForms);
		if (accepted) {
			newAcceptedForms.add(formId);
		} else {
			newAcceptedForms.delete(formId);
		}
		setAcceptedForms(newAcceptedForms);

		if (onFormsAccepted) {
			onFormsAccepted(Array.from(newAcceptedForms));
		}
	};

	const getCategoryIcon = (category: string) => {
		switch (category) {
			case "booking":
				return <FileText className="h-4 w-4" />;
			case "privacy":
				return <Shield className="h-4 w-4" />;
			case "emergency":
				return <AlertTriangle className="h-4 w-4" />;
			case "hipaa":
				return <Shield className="h-4 w-4" />;
			default:
				return <FileText className="h-4 w-4" />;
		}
	};

	const getCategoryColor = (category: string) => {
		switch (category) {
			case "booking":
				return "text-blue-600 bg-blue-50 border-blue-200";
			case "privacy":
				return "text-green-600 bg-green-50 border-green-200";
			case "emergency":
				return "text-orange-600 bg-orange-50 border-orange-200";
			case "hipaa":
				return "text-purple-600 bg-purple-50 border-purple-200";
			default:
				return "text-gray-600 bg-gray-50 border-gray-200";
		}
	};

	return (
		<div className={cn("space-y-6", className)}>
			<div className="space-y-4">
				<div className="flex items-center justify-between">
					<h3 className="font-semibold text-gray-900 text-lg">
						Legal Documents & Agreements
					</h3>
					{context === "booking" && (
						<div className="flex items-center space-x-2 text-gray-500 text-sm">
							<Check className="h-4 w-4" />
							<span>
								{acceptedForms.size} of {requiredForms.length} required forms
								accepted
							</span>
						</div>
					)}
				</div>

				<div className="grid gap-4">
					{relevantForms.map((form) => (
						<div
							key={form.id}
							className={cn(
								"rounded-lg border p-4 transition-colors",
								acceptedForms.has(form.id)
									? "border-green-200 bg-green-50"
									: "border-gray-200 bg-white",
								getCategoryColor(form.category),
							)}
						>
							<div className="flex items-start space-x-3">
								<div className="mt-1 flex-shrink-0">
									{getCategoryIcon(form.category)}
								</div>

								<div className="min-w-0 flex-1">
									<div className="flex items-start justify-between">
										<div className="flex-1">
											<h4 className="flex items-center space-x-2 font-medium text-base text-gray-900">
												<span>{form.title}</span>
												{form.required && (
													<span className="inline-flex items-center rounded bg-red-100 px-2 py-0.5 font-medium text-red-800 text-xs">
														Required
													</span>
												)}
											</h4>
											<p className="mt-1 text-gray-600 text-sm">
												{form.description}
											</p>
										</div>

										<div className="ml-4 flex items-center space-x-2">
											<Dialog
												open={openDialog === form.id}
												onOpenChange={(open) =>
													setOpenDialog(open ? form.id : null)
												}
											>
												<DialogTrigger asChild>
													<Button variant="outline" size="sm">
														View
													</Button>
												</DialogTrigger>
												<DialogContent className="max-h-[80vh] max-w-4xl">
													<DialogHeader>
														<DialogTitle className="flex items-center space-x-2">
															{getCategoryIcon(form.category)}
															<span>{form.title}</span>
														</DialogTitle>
													</DialogHeader>
													<ScrollArea className="h-[60vh] w-full">
														<div className="prose prose-sm max-w-none p-4">
															<iframe
																src={form.downloadUrl}
																className="h-full min-h-[500px] w-full border-0"
																title={form.title}
															/>
														</div>
													</ScrollArea>
													<div className="flex items-center justify-between border-t pt-4">
														<Button
															variant="outline"
															size="sm"
															onClick={() =>
																window.open(form.downloadUrl, "_blank")
															}
														>
															<Download className="mr-2 h-4 w-4" />
															Download PDF
														</Button>
														<div className="flex items-center space-x-3">
															<Checkbox
																id={`accept-${form.id}`}
																checked={acceptedForms.has(form.id)}
																onCheckedChange={(checked: boolean) => {
																	handleFormAcceptance(form.id, checked);
																}}
															/>
															<label
																htmlFor={`accept-${form.id}`}
																className="font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
															>
																I have read and accept this {form.title}
															</label>
														</div>
													</div>
												</DialogContent>
											</Dialog>

											<Button
												variant="ghost"
												size="sm"
												onClick={() => window.open(form.downloadUrl, "_blank")}
											>
												<Download className="h-4 w-4" />
											</Button>
										</div>
									</div>

									<div className="mt-3 flex items-center space-x-3">
										<Checkbox
											id={`quick-accept-${form.id}`}
											checked={acceptedForms.has(form.id)}
											onCheckedChange={(checked: boolean) => {
												handleFormAcceptance(form.id, checked);
											}}
										/>
										<label
											htmlFor={`quick-accept-${form.id}`}
											className="cursor-pointer text-gray-700 text-sm"
										>
											I have read and accept this {form.title.toLowerCase()}
											{form.required && " (required)"}
										</label>
									</div>
								</div>
							</div>
						</div>
					))}
				</div>

				{context === "booking" && (
					<div
						className={cn(
							"rounded-lg border-2 p-4 transition-colors",
							allRequiredAccepted
								? "border-green-300 bg-green-50"
								: "border-orange-300 bg-orange-50",
						)}
					>
						<div className="flex items-center space-x-2">
							{allRequiredAccepted ? (
								<>
									<Check className="h-5 w-5 text-green-600" />
									<span className="font-medium text-green-800">
										All required legal documents have been accepted
									</span>
								</>
							) : (
								<>
									<AlertTriangle className="h-5 w-5 text-orange-600" />
									<span className="font-medium text-orange-800">
										Please review and accept all required legal documents to
										continue
									</span>
								</>
							)}
						</div>
					</div>
				)}
			</div>

			{context === "standalone" && (
				<div className="border-t pt-6">
					<div className="space-y-4 text-center">
						<h4 className="font-medium text-gray-900 text-lg">Need Help?</h4>
						<p className="mx-auto max-w-2xl text-gray-600 text-sm">
							If you have questions about any of these legal documents, please
							contact our legal department or customer service team. All forms
							are available for download and should be reviewed before using our
							services.
						</p>
						<div className="flex justify-center space-x-4">
							<Button variant="outline">Contact Legal Department</Button>
							<Button variant="outline">Customer Service</Button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

export default LegalForms;
