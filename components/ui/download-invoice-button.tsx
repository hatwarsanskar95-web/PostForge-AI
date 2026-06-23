"use client";

import { useState } from "react";
import { Download } from "lucide-react";

interface PaymentDetails {
  id: string;
  amount: number;
  plan_slug: string;
  status: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  created_at: string;
}

interface UserDetails {
  name: string;
  email: string;
  id?: string;
  phone?: string;
}

export function DownloadInvoiceButton({ payment, user }: { payment: PaymentDetails; user: UserDetails }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setDownloading(true);
      // Dynamically import jsPDF to prevent SSR issues
      const jsPDF = (await import("jspdf")).default;
      const autoTable = (await import("jspdf-autotable")).default;

      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4"
      });
      
      // Build invoice variables
      const shortId = payment.razorpay_order_id?.substring(payment.razorpay_order_id.length - 6).toUpperCase() || '000000';
      const year = new Date(payment.created_at).getFullYear();
      const invoiceNumber = `INV-${year}-${shortId}`;
      const date = new Date(payment.created_at).toLocaleDateString("en-GB", { day: '2-digit', month: '2-digit', year: 'numeric' });

      let planName = payment.plan_slug;
      let cycle = "Monthly";
      
      if (payment.plan_slug === "starter") {
        planName = "Starter Pack";
      } else if (payment.plan_slug === "growth") {
        planName = "Growth Pack";
      } else if (payment.plan_slug === "pro") {
        planName = "Pro Pack";
      } else if (payment.plan_slug === "annual") {
        planName = "Annual Growth Plan";
        cycle = "Yearly";
      }

      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;

      // ─── TOP HEADER ───
      // Logo text
      doc.setFont("helvetica", "bold");
      doc.setFontSize(24);
      doc.setTextColor(20, 20, 20);
      doc.text("POSTFORGE", margin, 30);
      
      // Subtitle
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text("AI-Powered LinkedIn Content Platform", margin, 36);

      // Status Badge (PAID) - Right aligned
      const badgeWidth = 25;
      const badgeHeight = 8;
      const badgeX = pageWidth - margin - badgeWidth;
      const badgeY = 24;
      
      doc.setFillColor(220, 252, 231); // Light green background
      doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 1, 1, "F");
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(22, 163, 74); // Dark green text
      doc.text("PAID", badgeX + (badgeWidth / 2), badgeY + 5.5, { align: "center" });

      // Invoice Number & Date
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(50, 50, 50);
      doc.text("Invoice Number:", pageWidth - margin, 42, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.text(invoiceNumber, pageWidth - margin, 47, { align: "right" });

      doc.setFont("helvetica", "bold");
      doc.text("Invoice Date:", pageWidth - margin, 55, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.text(date, pageWidth - margin, 60, { align: "right" });

      // ─── DIVIDER ───
      doc.setDrawColor(230, 230, 230);
      doc.setLineWidth(0.5);
      doc.line(margin, 68, pageWidth - margin, 68);

      // ─── BILL TO ───
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text("BILL TO", margin, 80);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(30, 30, 30);
      doc.text(user.name || "Customer", margin, 88);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      let billY = 94;
      if (user.email) { doc.text(user.email, margin, billY); billY += 5; }
      if (user.phone) { doc.text(user.phone, margin, billY); billY += 5; }
      if (user.id) { doc.text(`User ID: ${user.id}`, margin, billY); billY += 5; }

      // ─── SUBSCRIPTION DETAILS ───
      autoTable(doc, {
        startY: 110,
        head: [['Plan Name', 'Billing Cycle', 'Purchase Date', 'Status']],
        body: [[planName, cycle, date, 'Active']],
        theme: 'plain',
        headStyles: {
          fillColor: [248, 250, 252],
          textColor: [100, 116, 139],
          fontStyle: 'bold',
          fontSize: 9,
          halign: 'left',
          cellPadding: 6
        },
        bodyStyles: {
          textColor: [30, 30, 30],
          fontSize: 10,
          cellPadding: 6
        },
        columnStyles: {
          3: { fontStyle: 'bold', textColor: [22, 163, 74] } // Active status
        },
        margin: { left: margin, right: margin }
      });

      // ─── PAYMENT DETAILS ───
      const paymentStartY = (doc as any).lastAutoTable.finalY + 15;
      
      autoTable(doc, {
        startY: paymentStartY,
        head: [['Payment Method', 'Transaction ID', 'Order ID', 'Payment Status']],
        body: [['Razorpay', payment.razorpay_payment_id || 'N/A', payment.razorpay_order_id || 'N/A', 'PAID']],
        theme: 'plain',
        headStyles: {
          fillColor: [248, 250, 252],
          textColor: [100, 116, 139],
          fontStyle: 'bold',
          fontSize: 9,
          halign: 'left',
          cellPadding: 6
        },
        bodyStyles: {
          textColor: [30, 30, 30],
          fontSize: 10,
          cellPadding: 6
        },
        margin: { left: margin, right: margin }
      });

      // ─── PAYMENT SUMMARY ───
      const summaryStartY = (doc as any).lastAutoTable.finalY + 15;
      const summaryBoxWidth = 80;
      const summaryBoxX = pageWidth - margin - summaryBoxWidth;

      // Summary Box Background
      doc.setFillColor(248, 250, 252);
      doc.roundedRect(summaryBoxX, summaryStartY, summaryBoxWidth, 38, 3, 3, "F");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text("Amount:", summaryBoxX + 6, summaryStartY + 10);
      doc.text(`Rs. ${payment.amount}`, summaryBoxX + summaryBoxWidth - 6, summaryStartY + 10, { align: "right" });

      doc.text("Tax:", summaryBoxX + 6, summaryStartY + 18);
      doc.text("Rs. 0", summaryBoxX + summaryBoxWidth - 6, summaryStartY + 18, { align: "right" });

      doc.setDrawColor(220, 220, 220);
      doc.line(summaryBoxX + 6, summaryStartY + 24, summaryBoxX + summaryBoxWidth - 6, summaryStartY + 24);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(30, 30, 30);
      doc.text("Total Paid:", summaryBoxX + 6, summaryStartY + 32);
      doc.text(`Rs. ${payment.amount}`, summaryBoxX + summaryBoxWidth - 6, summaryStartY + 32, { align: "right" });

      // ─── CONTACT INFORMATION (FOOTER AREA) ───
      const contactY = 245;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(150, 150, 150);
      doc.text("CONTACT INFORMATION", margin, contactY);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);
      doc.text("Email: hatwarsanskar95@gmail.com", margin, contactY + 8);
      doc.text("Phone: 9970899101", margin, contactY + 14);
      doc.text("Website: PostForge", margin, contactY + 20);

      // ─── FOOTER TEXT ───
      const footerY = 275;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text("Thank you for choosing PostForge.", pageWidth / 2, footerY, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(180, 180, 180);
      doc.text("This is a computer-generated invoice and does not require a signature.", pageWidth / 2, footerY + 6, { align: "center" });
      doc.text("Generated Automatically By PostForge Billing System.", pageWidth / 2, footerY + 11, { align: "center" });

      // Save the PDF
      doc.save(`PostForge-Invoice-${invoiceNumber}.pdf`);
    } catch (err) {
      console.error("Failed to generate PDF:", err);
      alert("Failed to generate PDF invoice. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button 
      onClick={handleDownload}
      disabled={downloading}
      className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Download size={16} />
      {downloading ? "Generating..." : "Download Invoice"}
    </button>
  );
}
