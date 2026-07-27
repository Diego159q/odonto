import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { citaService, usuarioService } from '../services/endpoints';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { toast } from 'react-toastify';

const localizer = momentLocalizer(moment);

const ESTADO_COLORS = {
  PENDIENTE: { backgroundColor: '#FFF3E0', borderColor: '#E65100', color: '#E65100' },
  CONFIRMADA: { backgroundColor: '#E3F2FD', borderColor: '#1565C0', color: '#1565C0' },
  ATENDIDA: { backgroundColor: '#E8F5E9', borderColor: '#2E7D32', color: '#2E7D32' },
  CANCELADA: { backgroundColor: '#FFEBEE', borderColor: '#C62828', color: '#C62828' },
  REPROGRAMADA: { backgroundColor: '#F3E5F5', borderColor: '#6A1B9A', color: '#6A1B9A' },
  NO_ASISTIO: { backgroundColor: '#FFF8E1', borderColor: '#F57F17', color: '#F57F17' },
};

const CalendarioCitas = () => {
  const navigate = useNavigate();
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [odontologos, setOdontologos] = useState([]);
  const [odontologoFilter, setOdontologoFilter] = useState('');
  const [selectedEvent, setSelectedEvent] = useState(null);

  const fetchOdontologos = useCallback(async () => {
    try {
      const response = await usuarioService.listar({ rol: 'ODONTOLOGA' });
      const data = response.data;
      setOdontologos(data.content || (Array.isArray(data) ? data : []));
    } catch {
      // non-critical
    }
  }, []);

  const fetchCitas = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (odontologoFilter) params.odontologoId = odontologoFilter;
      const response = await citaService.listar(params);
      const data = response.data;
      const list = data.content || (Array.isArray(data) ? data : []);
      setCitas(list);
    } catch (error) {
      const msg = error.response?.data?.message || 'Error al cargar citas';
      toast.error(msg);
      setCitas([]);
    } finally {
      setLoading(false);
    }
  }, [odontologoFilter]);

  useEffect(() => {
    fetchOdontologos();
  }, [fetchOdontologos]);

  useEffect(() => {
    fetchCitas();
  }, [fetchCitas]);

  const events = citas
    .filter((c) => c.estado !== 'CANCELADA')
    .map((cita) => {
      const fechaStr = cita.fecha;
      const start = new Date(`${fechaStr}T${cita.horaInicio || '00:00'}`);
      const end = new Date(`${fechaStr}T${cita.horaFin || '23:59'}`);
      const pacienteName = cita.paciente
        ? `${cita.paciente.nombres || ''} ${cita.paciente.apellidos || ''}`.trim()
        : 'Sin paciente';
      const odontologoName = cita.odontologo
        ? `${cita.odontologo.nombre || cita.odontologo.nombres || ''} ${cita.odontologo.apellidos || ''}`.trim()
        : '';
      return {
        id: cita.id,
        title: `${pacienteName} ${cita.horaInicio ? `(${cita.horaInicio})` : ''}`,
        start,
        end,
        cita,
        pacienteName,
        odontologoName,
        estado: cita.estado || 'PENDIENTE',
      };
    });

  const eventPropGetter = (event) => {
    const colors = ESTADO_COLORS[event.estado] || ESTADO_COLORS.PENDIENTE;
    return {
      style: {
        backgroundColor: colors.backgroundColor,
        borderLeft: `4px solid ${colors.borderColor}`,
        color: colors.color,
        borderRadius: '4px',
        padding: '2px 6px',
        fontSize: '0.8rem',
        fontWeight: 500,
        opacity: event.estado === 'CANCELADA' ? 0.5 : 1,
      },
    };
  };

  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
  };

  const handleSelectSlot = (slotInfo) => {
    const startDate = moment(slotInfo.start).format('YYYY-MM-DD');
    navigate(`/citas/nueva?fecha=${startDate}`);
  };

  const handleViewDetails = () => {
    if (selectedEvent) {
      navigate(`/citas/${selectedEvent.id}/editar`);
    }
  };

  const formatHour = (hour) => hour || '-';

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
    return d.toLocaleDateString('es-MX', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h2 className="page-title">
          <i className="bi bi-calendar-week-fill me-2 text-primary"></i>Calendario de Citas
        </h2>
        <div className="d-flex align-items-center gap-3 flex-wrap">
          <div className="d-flex align-items-center gap-2">
            <label htmlFor="filterOdontologo" className="form-label mb-0 text-nowrap">
              <i className="bi bi-person-badge me-1"></i>Odontólogo:
            </label>
            <select
              id="filterOdontologo"
              className="form-select form-select-sm"
              style={{ minWidth: 180 }}
              value={odontologoFilter}
              onChange={(e) => setOdontologoFilter(e.target.value)}
            >
              <option value="">Todos</option>
              {odontologos.map((odo) => (
                <option key={odo.id} value={odo.id}>
                  {odo.nombre || odo.nombres || ''} {odo.apellidos || ''}
                </option>
              ))}
            </select>
          </div>
          <div className="d-flex gap-2 align-items-center">
            {Object.entries(ESTADO_COLORS).map(([estado, colors]) => (
              <span
                key={estado}
                className="badge"
                style={{
                  backgroundColor: colors.backgroundColor,
                  color: colors.color,
                  border: `1px solid ${colors.borderColor}40`,
                  fontSize: '0.7rem',
                }}
              >
                {estado}
              </span>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      ) : (
        <div className="rbc-calendar" style={{ height: 'calc(100vh - 220px)', minHeight: 500 }}>
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            titleAccessor="title"
            eventPropGetter={eventPropGetter}
            onSelectEvent={handleSelectEvent}
            onSelectSlot={handleSelectSlot}
            selectable
            views={['month', 'week', 'day']}
            defaultView="month"
            popup
            messages={{
              next: 'Siguiente',
              previous: 'Anterior',
              today: 'Hoy',
              month: 'Mes',
              week: 'Semana',
              day: 'Día',
              date: 'Fecha',
              time: 'Hora',
              event: 'Evento',
              noEventsInRange: 'No hay citas en este rango',
              showMore: (total) => `+${total} más`,
            }}
          />
        </div>
      )}

      {selectedEvent && (
        <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-info-circle-fill text-primary me-2"></i>Detalles de la Cita
                </h5>
                <button type="button" className="btn-close" onClick={() => setSelectedEvent(null)}></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-6">
                    <small className="text-muted d-block">Paciente</small>
                    <strong>{selectedEvent.cita?.paciente
                      ? `${selectedEvent.cita.paciente.nombres || ''} ${selectedEvent.cita.paciente.apellidos || ''}`.trim()
                      : '-'}</strong>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block">Odontólogo</small>
                    <strong>{selectedEvent.odontologoName || '-'}</strong>
                  </div>
                  <div className="col-4">
                    <small className="text-muted d-block">Fecha</small>
                    <strong>{formatDate(selectedEvent.cita?.fecha)}</strong>
                  </div>
                  <div className="col-4">
                    <small className="text-muted d-block">Hora Inicio</small>
                    <strong>{formatHour(selectedEvent.cita?.horaInicio)}</strong>
                  </div>
                  <div className="col-4">
                    <small className="text-muted d-block">Hora Fin</small>
                    <strong>{formatHour(selectedEvent.cita?.horaFin)}</strong>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block">Estado</small>
                    <div>
                      <span
                        className="badge"
                        style={{
                          backgroundColor: (ESTADO_COLORS[selectedEvent.cita?.estado] || ESTADO_COLORS.PENDIENTE).backgroundColor,
                          color: (ESTADO_COLORS[selectedEvent.cita?.estado] || ESTADO_COLORS.PENDIENTE).color,
                        }}
                      >
                        {selectedEvent.cita?.estado || 'PENDIENTE'}
                      </span>
                    </div>
                  </div>
                  <div className="col-6">
                    <small className="text-muted d-block">Motivo</small>
                    <strong>{selectedEvent.cita?.motivo || '-'}</strong>
                  </div>
                  {selectedEvent.cita?.tipoAtencion && (
                    <div className="col-6">
                      <small className="text-muted d-block">Tipo Atención</small>
                      <strong>{selectedEvent.cita.tipoAtencion}</strong>
                    </div>
                  )}
                  {selectedEvent.cita?.consultorio && (
                    <div className="col-6">
                      <small className="text-muted d-block">Consultorio</small>
                      <strong>{selectedEvent.cita.consultorio}</strong>
                    </div>
                  )}
                  {selectedEvent.cita?.observaciones && (
                    <div className="col-12">
                      <small className="text-muted d-block">Observaciones</small>
                      <strong>{selectedEvent.cita.observaciones}</strong>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer d-flex justify-content-between">
                <div>
                  {selectedEvent.cita?.estado === 'PENDIENTE' && (
                    <button
                      className="btn btn-sm btn-outline-primary me-1"
                      onClick={async () => {
                        try {
                          await citaService.confirmar(selectedEvent.id);
                          toast.success('Cita confirmada');
                          setSelectedEvent(null);
                          fetchCitas();
                        } catch (error) {
                          toast.error(error.response?.data?.message || 'Error al confirmar');
                        }
                      }}
                    >
                      <i className="bi bi-check-lg me-1"></i>Confirmar
                    </button>
                  )}
                </div>
                <div>
                  <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => setSelectedEvent(null)}>
                    Cerrar
                  </button>
                  <button className="btn btn-sm btn-dental-primary" onClick={handleViewDetails}>
                    <i className="bi bi-pencil me-1"></i>Editar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarioCitas;
