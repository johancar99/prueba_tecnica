import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import * as QRCode from 'qrcode';

export interface PrescriptionPdfData {
  code: string;
  createdAt: Date;
  notes?: string | null;
  doctor: {
    name: string;
    licenseNumber: string;
    specialty?: string | null;
  };
  patient: {
    name: string;
    email: string;
    birthDate?: Date | null;
  };
  items: Array<{
    medication: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string | null;
  }>;
}

@Injectable()
export class PdfService {
  async generatePrescriptionPdf(data: PrescriptionPdfData): Promise<Buffer> {
    const qrDataUrl = await QRCode.toDataURL(data.code, { width: 120, margin: 1 }).catch(() => {
      throw new InternalServerErrorException('Error generando codigo QR');
    });
    const qrBuffer = Buffer.from(qrDataUrl.replace(/^data:image\/png;base64,/, ''), 'base64');

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      this.renderHeader(doc);
      this.renderDoctorAndPatient(doc, data);
      this.renderCodeAndQR(doc, data.code, qrBuffer, data.createdAt);
      this.renderItems(doc, data.items);
      if (data.notes) this.renderNotes(doc, data.notes);
      this.renderFooter(doc);
      doc.end();
    });
  }

  private renderHeader(doc: PDFKit.PDFDocument): void {
    doc.fillColor('#2563eb').fontSize(22).font('Helvetica-Bold').text('PRESCRIPCION MEDICA', { align: 'center' });
    doc.moveDown(0.3).fillColor('#64748b').fontSize(10).font('Helvetica').text('Sistema de Prescripciones Medicas', { align: 'center' });
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#2563eb').lineWidth(2).stroke();
    doc.moveDown(1);
  }

  private renderDoctorAndPatient(doc: PDFKit.PDFDocument, data: PrescriptionPdfData): void {
    const startY = doc.y;
    doc.fillColor('#1e293b').fontSize(11).font('Helvetica-Bold').text('MEDICO', 50, startY);
    doc.moveDown(0.4);
    doc.fontSize(10).font('Helvetica').fillColor('#334155');
    doc.text('Nombre: ' + data.doctor.name, 50);
    doc.text('Licencia: ' + data.doctor.licenseNumber, 50);
    if (data.doctor.specialty) doc.text('Especialidad: ' + data.doctor.specialty, 50);
    doc.fillColor('#1e293b').fontSize(11).font('Helvetica-Bold').text('PACIENTE', 300, startY);
    doc.fontSize(10).font('Helvetica').fillColor('#334155');
    doc.text('Nombre: ' + data.patient.name, 300, startY + 17);
    doc.text('Email: ' + data.patient.email, 300, startY + 30);
    if (data.patient.birthDate) {
      doc.text('Fecha nac.: ' + new Date(data.patient.birthDate).toLocaleDateString('es-ES'), 300, startY + 43);
    }
    doc.y = Math.max(doc.y, startY + 70);
    doc.moveDown(0.8);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e2e8f0').lineWidth(1).stroke();
    doc.moveDown(0.8);
  }

  private renderCodeAndQR(doc: PDFKit.PDFDocument, code: string, qrBuffer: Buffer, createdAt: Date): void {
    const startY = doc.y;
    doc.fillColor('#1e293b').fontSize(11).font('Helvetica-Bold').text('CODIGO DE PRESCRIPCION', 50, startY);
    doc.moveDown(0.4);
    doc.fillColor('#2563eb').fontSize(14).font('Helvetica-Bold').text(code, 50);
    doc.fillColor('#64748b').fontSize(9).font('Helvetica').text('Emitida: ' + new Date(createdAt).toLocaleString('es-ES'), 50);
    doc.image(qrBuffer, 430, startY, { width: 90, height: 90 });
    doc.y = Math.max(doc.y, startY + 100);
    doc.moveDown(0.8);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e2e8f0').lineWidth(1).stroke();
    doc.moveDown(0.8);
  }

  private renderItems(doc: PDFKit.PDFDocument, items: PrescriptionPdfData['items']): void {
    doc.fillColor('#1e293b').fontSize(11).font('Helvetica-Bold').text('MEDICAMENTOS PRESCRITOS');
    doc.moveDown(0.6);
    items.forEach((item, idx) => {
      const itemY = doc.y;
      doc.roundedRect(50, itemY - 4, 495, 62, 4).fillAndStroke(idx % 2 === 0 ? '#f8fafc' : '#ffffff', '#e2e8f0');
      doc.fillColor('#1e293b').fontSize(11).font('Helvetica-Bold').text((idx + 1) + '. ' + item.medication, 60, itemY + 2);
      doc.fillColor('#334155').fontSize(9).font('Helvetica');
      doc.text('Dosis: ' + item.dosage, 60, itemY + 18);
      doc.text('Frecuencia: ' + item.frequency, 200, itemY + 18);
      doc.text('Duracion: ' + item.duration, 370, itemY + 18);
      if (item.instructions) doc.text('Instrucciones: ' + item.instructions, 60, itemY + 32, { width: 470 });
      doc.y = itemY + 70;
    });
    doc.moveDown(0.5);
  }

  private renderNotes(doc: PDFKit.PDFDocument, notes: string): void {
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#e2e8f0').lineWidth(1).stroke();
    doc.moveDown(0.8);
    doc.fillColor('#1e293b').fontSize(11).font('Helvetica-Bold').text('NOTAS ADICIONALES');
    doc.moveDown(0.4);
    doc.fillColor('#334155').fontSize(10).font('Helvetica').text(notes, 50, doc.y, { width: 495 });
    doc.moveDown(0.5);
  }

  private renderFooter(doc: PDFKit.PDFDocument): void {
    const footerY = doc.page.height - 60;
    doc.moveTo(50, footerY).lineTo(545, footerY).strokeColor('#e2e8f0').lineWidth(1).stroke();
    doc.fillColor('#94a3b8').fontSize(8).font('Helvetica').text(
      'Este documento es una prescripcion medica digital. Verifique su autenticidad mediante el codigo QR.',
      50, footerY + 8, { align: 'center', width: 495 }
    );
  }
}
