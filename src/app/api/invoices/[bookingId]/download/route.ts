import { NextRequest, NextResponse } from "next/server";
import { auth } from "~/lib/auth/better-auth";
import { generateInvoicePDF } from "~/lib/invoice/pdf-generator";
import { db } from "~/server/db";

export async function GET(
	request: NextRequest,
	{ params }: { params: { bookingId: string } }
) {
	try {
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session) {
			return NextResponse.json(
				{ error: "Unauthorized" },
				{ status: 401 }
			);
		}

		const { bookingId } = params;

		// Verify booking exists and user has access
		const booking = await db.booking.findUnique({
			where: { id: bookingId },
			include: {
				customer: true,
				pet: true,
				kennel: true,
			},
		});

		if (!booking) {
			return NextResponse.json(
				{ error: "Booking not found" },
				{ status: 404 }
			);
		}

		// Check permissions - customer can only access their own bookings
		// Admin/Owner can access any booking
		const userRole = (session.user as { role?: string })?.role;
		const isCustomer = userRole === "CUSTOMER";
		const isAdmin = userRole === "ADMIN" || userRole === "OWNER";

		if (isCustomer && booking.customerId !== session.user.id) {
			return NextResponse.json(
				{ error: "Unauthorized to access this booking" },
				{ status: 403 }
			);
		}

		if (!isCustomer && !isAdmin) {
			return NextResponse.json(
				{ error: "Insufficient permissions" },
				{ status: 403 }
			);
		}

		// Generate PDF
		const pdfBuffer = await generateInvoicePDF(bookingId);

		// Return PDF as download
		return new NextResponse(pdfBuffer, {
			headers: {
				"Content-Type": "application/pdf",
				"Content-Disposition": `attachment; filename="invoice-${bookingId}.pdf"`,
				"Content-Length": pdfBuffer.length.toString(),
			},
		});
	} catch (error) {
		console.error("Invoice generation error:", error);
		return NextResponse.json(
			{ error: "Failed to generate invoice" },
			{ status: 500 }
		);
	}
}
