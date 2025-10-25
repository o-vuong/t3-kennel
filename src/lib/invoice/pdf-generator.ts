import jsPDF from "jspdf";
import { db } from "~/server/db";

interface InvoiceData {
	bookingId: string;
	customerName: string;
	customerEmail: string;
	petName: string;
	kennelName: string;
	startDate: Date;
	endDate: Date;
	price: number;
	currency: string;
	invoiceNumber: string;
	issueDate: Date;
	dueDate: Date;
}

export class InvoicePDFGenerator {
	private doc: jsPDF;

	constructor() {
		this.doc = new jsPDF();
	}

	async generateInvoice(bookingId: string): Promise<Buffer> {
		// Fetch booking data with related information
		const booking = await db.booking.findUnique({
			where: { id: bookingId },
			include: {
				customer: true,
				pet: true,
				kennel: true,
			},
		});

		if (!booking) {
			throw new Error("Booking not found");
		}

		const invoiceData: InvoiceData = {
			bookingId: booking.id,
			customerName: booking.customer.name || "Customer",
			customerEmail: booking.customer.email,
			petName: booking.pet.name,
			kennelName: booking.kennel?.name || "Kennel",
			startDate: booking.startDate,
			endDate: booking.endDate,
			price: Number(booking.price),
			currency: "USD",
			invoiceNumber: `INV-${booking.id.slice(-8).toUpperCase()}`,
			issueDate: new Date(),
			dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
		};

		return this.createPDF(invoiceData);
	}

	private createPDF(data: InvoiceData): Buffer {
		const doc = new jsPDF();
		const pageWidth = doc.internal.pageSize.getWidth();
		const pageHeight = doc.internal.pageSize.getHeight();
		const margin = 20;
		const contentWidth = pageWidth - 2 * margin;

		// Colors
		const primaryColor = [41, 128, 185]; // Blue
		const secondaryColor = [52, 73, 94]; // Dark gray
		const lightGray = [236, 240, 241]; // Light gray

		// Header
		doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
		doc.rect(0, 0, pageWidth, 60, "F");

		// Company name
		doc.setTextColor(255, 255, 255);
		doc.setFontSize(24);
		doc.setFont("helvetica", "bold");
		doc.text("Kennel Management", margin, 25);

		// Tagline
		doc.setFontSize(12);
		doc.setFont("helvetica", "normal");
		doc.text("Professional Pet Care Services", margin, 35);

		// Invoice title
		doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
		doc.setFontSize(20);
		doc.setFont("helvetica", "bold");
		doc.text("INVOICE", pageWidth - margin - 30, 25);

		// Invoice number
		doc.setFontSize(12);
		doc.setFont("helvetica", "normal");
		doc.text(`Invoice #: ${data.invoiceNumber}`, pageWidth - margin - 30, 35);

		// Date
		doc.text(`Date: ${data.issueDate.toLocaleDateString()}`, pageWidth - margin - 30, 45);

		// Customer information
		doc.setTextColor(0, 0, 0);
		doc.setFontSize(14);
		doc.setFont("helvetica", "bold");
		doc.text("Bill To:", margin, 80);

		doc.setFontSize(12);
		doc.setFont("helvetica", "normal");
		doc.text(data.customerName, margin, 90);
		doc.text(data.customerEmail, margin, 100);

		// Service details
		doc.setFontSize(14);
		doc.setFont("helvetica", "bold");
		doc.text("Service Details:", margin, 120);

		// Service table header
		doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
		doc.rect(margin, 130, contentWidth, 20, "F");

		doc.setTextColor(0, 0, 0);
		doc.setFontSize(10);
		doc.setFont("helvetica", "bold");
		doc.text("Description", margin + 5, 142);
		doc.text("Pet", margin + 80, 142);
		doc.text("Kennel", margin + 120, 142);
		doc.text("Duration", margin + 160, 142);
		doc.text("Amount", margin + 200, 142);

		// Service details row
		const serviceStartY = 150;
		doc.setFont("helvetica", "normal");
		doc.text("Pet Boarding Service", margin + 5, serviceStartY);
		doc.text(data.petName, margin + 80, serviceStartY);
		doc.text(data.kennelName, margin + 120, serviceStartY);
		
		const duration = this.calculateDuration(data.startDate, data.endDate);
		doc.text(duration, margin + 160, serviceStartY);
		
		const formattedAmount = this.formatCurrency(data.price, data.currency);
		doc.text(formattedAmount, margin + 200, serviceStartY);

		// Total section
		const totalY = serviceStartY + 30;
		doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
		doc.rect(margin + 150, totalY - 10, 50, 20, "F");

		doc.setTextColor(0, 0, 0);
		doc.setFontSize(12);
		doc.setFont("helvetica", "bold");
		doc.text("Total:", margin + 155, totalY);
		doc.text(formattedAmount, margin + 155, totalY + 8);

		// Payment terms
		const termsY = totalY + 40;
		doc.setFontSize(10);
		doc.setFont("helvetica", "normal");
		doc.text("Payment Terms:", margin, termsY);
		doc.text(`Due Date: ${data.dueDate.toLocaleDateString()}`, margin, termsY + 10);
		doc.text("Payment methods: Credit Card, Bank Transfer", margin, termsY + 20);

		// Footer
		const footerY = pageHeight - 40;
		doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
		doc.rect(0, footerY, pageWidth, 40, "F");

		doc.setTextColor(255, 255, 255);
		doc.setFontSize(10);
		doc.setFont("helvetica", "normal");
		doc.text("Thank you for choosing our services!", margin, footerY + 15);
		doc.text("For questions, contact us at support@kennel.com", margin, footerY + 25);

		// Convert to buffer
		const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
		return pdfBuffer;
	}

	private calculateDuration(startDate: Date, endDate: Date): string {
		const diffTime = endDate.getTime() - startDate.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
		return `${diffDays} day${diffDays !== 1 ? "s" : ""}`;
	}

	private formatCurrency(amount: number, currency: string): string {
		return new Intl.NumberFormat("en-US", {
			style: "currency",
			currency: currency,
		}).format(amount);
	}
}

export async function generateInvoicePDF(bookingId: string): Promise<Buffer> {
	const generator = new InvoicePDFGenerator();
	return generator.generateInvoice(bookingId);
}
