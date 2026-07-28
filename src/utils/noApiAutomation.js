import jsPDF from 'jspdf';

const DEFAULT_COUNTRY_CODE = '51';
const CLINIC_NAME = 'DentalCare';

export const cleanPhone = (phone) => String(phone || '').replace(/\D/g, '');

export const formatCurrency = (value) => {
  if (value === null || value === undefined || value === '') return 'S/ 0.00';
  return `S/ ${Number(value).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const formatShortDate = (dateStr) => {
  if (!dateStr) return '-';
  return new Date(`${dateStr}${String(dateStr).includes('T') ? '' : 'T00:00:00'}`).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

export const getPersonName = (value) => {
  if (!value) return 'Paciente';
  if (typeof value === 'string') return value;
  return `${value.nombres || value.nombre || ''} ${value.apellidos || ''}`.trim() || value.pacienteNombre || 'Paciente';
};

export const getPatientNameFrom = (item) => {
  if (!item) return 'Paciente';
  if (item.paciente && typeof item.paciente === 'object') return getPersonName(item.paciente);
  return item.pacienteNombre || item.nombrePaciente || item.paciente || getPersonName(item);
};

export const getPatientPhoneFrom = (item) => {
  if (!item) return '';
  if (item.paciente && typeof item.paciente === 'object') return item.paciente.telefono || item.paciente.celular || item.paciente.phone || '';
  return item.telefono || item.celular || item.pacienteTelefono || item.telefonoPaciente || '';
};

export const buildWhatsAppUrl = ({ phone, message, countryCode = DEFAULT_COUNTRY_CODE }) => {
  const cleaned = cleanPhone(phone);
  const normalized = cleaned.length === 9 ? `${countryCode}${cleaned}` : cleaned;
  const text = encodeURIComponent(message || '');
  return normalized ? `https://wa.me/${normalized}?text=${text}` : `https://wa.me/?text=${text}`;
};

export const appointmentReminderMessage = (cita) => {
  const name = getPatientNameFrom(cita);
  const date = formatShortDate(cita?.fecha);
  const hour = cita?.horaInicio || cita?.hora || '--:--';
  return `Hola ${name}, le recordamos su cita en ${CLINIC_NAME} para el ${date} a las ${hour}. Por favor confirme su asistencia. Gracias.`;
};

export const appointmentConfirmationMessage = (cita) => {
  const name = getPatientNameFrom(cita);
  const date = formatShortDate(cita?.fecha);
  const hour = cita?.horaInicio || cita?.hora || '--:--';
  return `Hola ${name}, su cita en ${CLINIC_NAME} quedo programada para el ${date} a las ${hour}. Si necesita reprogramar, respondanos por este medio.`;
};

export const patientFollowUpMessage = (paciente) => {
  const name = getPersonName(paciente);
  return `Hola ${name}, le escribimos de ${CLINIC_NAME} para coordinar su control odontologico. Tenemos horarios disponibles esta semana.`;
};

export const paymentReminderMessage = (item) => {
  const name = getPatientNameFrom(item);
  const amount = item?.saldo || item?.deuda || item?.montoPendiente || item?.montoTotal || 0;
  return `Hola ${name}, le recordamos que tiene un saldo pendiente de ${formatCurrency(amount)} en ${CLINIC_NAME}. Puede responder este mensaje para coordinar el pago. Gracias.`;
};

export const postCareMessage = (paciente, treatment = 'tratamiento') => {
  const name = getPersonName(paciente);
  return `Hola ${name}, estas son sus indicaciones despues de su ${treatment}: evite comidas duras o muy calientes, mantenga buena higiene, tome los medicamentos indicados y contactenos si presenta dolor intenso o sangrado persistente.`;
};

const toIcsDate = (date, time) => {
  const safeTime = time || '09:00';
  return `${String(date || '').replace(/-/g, '')}T${safeTime.replace(':', '')}00`;
};

export const downloadAppointmentIcs = (cita) => {
  const start = toIcsDate(cita?.fecha, cita?.horaInicio || cita?.hora);
  const end = toIcsDate(cita?.fecha, cita?.horaFin || cita?.horaInicio || cita?.hora);
  const patient = getPatientNameFrom(cita);
  const title = `Cita odontologica - ${patient}`;
  const description = `${cita?.motivo || 'Atencion odontologica'} | Estado: ${cita?.estado || 'PENDIENTE'}`;
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//DentalCare//No API Calendar//ES',
    'BEGIN:VEVENT',
    `UID:cita-${cita?.id || Date.now()}@dentalcare.local`,
    `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `cita-${cita?.id || 'dentalcare'}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

export const downloadPaymentReceiptPdf = (pago) => {
  const doc = new jsPDF();
  const patient = getPatientNameFrom(pago);
  const amount = pago?.montoPagado || pago?.monto || 0;
  let y = 18;
  doc.setFontSize(16);
  doc.text('Recibo de pago DentalCare', 14, y);
  y += 12;
  doc.setFontSize(11);
  doc.text(`Recibo: #${pago?.id || '-'}`, 14, y); y += 8;
  doc.text(`Paciente: ${patient}`, 14, y); y += 8;
  doc.text(`Fecha: ${formatShortDate(pago?.fecha)}`, 14, y); y += 8;
  doc.text(`Monto pagado: ${formatCurrency(amount)}`, 14, y); y += 8;
  doc.text(`Metodo: ${pago?.metodoPago || '-'}`, 14, y); y += 8;
  doc.text(`Operacion: ${pago?.numeroOperacion || '-'}`, 14, y); y += 8;
  doc.text(`Saldo: ${formatCurrency(pago?.saldo || 0)}`, 14, y); y += 12;
  doc.text('Observaciones:', 14, y); y += 7;
  doc.text(doc.splitTextToSize(pago?.observaciones || 'Pago registrado en el sistema.', 180), 14, y);
  doc.save(`recibo-pago-${pago?.id || 'dentalcare'}.pdf`);
};
