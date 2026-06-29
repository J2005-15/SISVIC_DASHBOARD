import React from 'react';
import { LOGO } from '../utils/constants/images';

export default function RecipeTemplate({ consulta }) {
  if (!consulta) return null;

  const fecha = consulta.appointment_date
    ? new Date(consulta.appointment_date).toLocaleDateString('es-VE', { dateStyle: 'long' })
    : '—';

  const emision = new Date().toLocaleDateString('es-VE', { dateStyle: 'long' });

  return (
    <div style={{ fontFamily: '"Georgia", "Times New Roman", serif', color: '#111', padding: 0, margin: 0 }}>

      {/* ── MEMBRETE ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', borderBottom: '2.5px solid #765A05', paddingBottom: '14px', marginBottom: '22px' }}>
        <tbody>
          <tr>
            <td style={{ verticalAlign: 'middle', paddingRight: '16px', width: '76px' }}>
              <img src={LOGO} alt="Misión Nevado" className="w-full h-auto" style={{ height: '68px', objectFit: 'contain', display: 'block' }} />
            </td>
            <td style={{ verticalAlign: 'middle' }}>
              <p style={{ margin: '0 0 2px', fontSize: '16px', fontWeight: 'bold', color: '#765A05', letterSpacing: '0.02em' }}>
                FUNDACIÓN MISIÓN NEVADO
              </p>
              <p style={{ margin: '0 0 2px', fontSize: '11px', color: '#555' }}>
                Sistema de Control Veterinario Institucional — SISCVI
              </p>
              <p style={{ margin: 0, fontSize: '11px', color: '#555' }}>
                República Bolivariana de Venezuela
              </p>
            </td>
            <td style={{ verticalAlign: 'middle', textAlign: 'right' }}>
              <p style={{ margin: '0 0 4px', fontSize: '9px', fontWeight: 'bold', color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                Récipe Médico Veterinario
              </p>
              <p style={{ margin: '0 0 3px', fontSize: '15px', fontWeight: 'bold', color: '#765A05' }}>
                N° {String(consulta.id_record).padStart(5, '0')}
              </p>
              <p style={{ margin: 0, fontSize: '11px', color: '#555' }}>
                Emitido: {emision}
              </p>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── DATOS DEL PACIENTE ── */}
      <div style={{ background: '#fdf8ec', border: '1px solid #e4d08a', borderRadius: '6px', padding: '14px 18px', marginBottom: '18px' }}>
        <p style={{ margin: '0 0 10px', fontSize: '10px', fontWeight: 'bold', color: '#765A05', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
          Datos del Paciente
        </p>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <FieldCell label="Nombre del Animal"       value={consulta.Animal_Census?.animal_name ?? '—'} />
              <FieldCell label="Veterinario de Guardia"  value={consulta.User?.name ?? '—'} />
              <FieldCell label="Fecha de Consulta"       value={fecha} />
            </tr>
            <tr>
              <FieldCell label="Peso registrado"         value={consulta.weight_kg    != null ? `${consulta.weight_kg} kg`   : '—'} />
              <FieldCell label="Temperatura corporal"    value={consulta.temperature  != null ? `${consulta.temperature} °C` : '—'} />
              <FieldCell label="N° de Expediente"        value={`EXP-${String(consulta.id_record).padStart(4, '0')}`} />
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── MOTIVO Y DIAGNÓSTICO ── */}
      <p style={{ margin: '0 0 8px', fontSize: '10px', fontWeight: 'bold', color: '#765A05', textTransform: 'uppercase', letterSpacing: '0.12em', borderBottom: '1px solid #e4d08a', paddingBottom: '5px' }}>
        Motivo de Consulta y Diagnóstico
      </p>
      <Block label="Motivo de Consulta"      value={consulta.consultation_reason} borderColor="#765A05" bg="#fffbf5" />
      <Block label="Diagnóstico Preliminar"  value={consulta.diagnosis}           borderColor="#4a7c59" bg="#f5fff8" />

      {/* ── TRATAMIENTO ── */}
      <p style={{ margin: '16px 0 8px', fontSize: '10px', fontWeight: 'bold', color: '#765A05', textTransform: 'uppercase', letterSpacing: '0.12em', borderBottom: '1px solid #e4d08a', paddingBottom: '5px' }}>
        Tratamiento Indicado
      </p>
      <Block label="" value={consulta.treatment} borderColor="#2d6a4f" bg="#f2fbf5" />

      {/* ── FIRMA ── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '52px', marginBottom: '20px' }}>
        <div style={{ width: '210px', textAlign: 'center' }}>
          <div style={{ borderTop: '1.5px solid #765A05', paddingTop: '8px' }}>
            <p style={{ margin: '0 0 2px', fontSize: '12px', fontWeight: 'bold', color: '#333' }}>
              {consulta.User?.name ?? 'Médico Veterinario'}
            </p>
            <p style={{ margin: 0, fontSize: '10px', color: '#777' }}>Médico Veterinario — SISCVI</p>
            <p style={{ margin: '2px 0 0', fontSize: '10px', color: '#777' }}>Fundación Misión Nevado</p>
          </div>
        </div>
      </div>

      {/* ── PIE ── */}
      <div style={{ borderTop: '1px solid #ddd', paddingTop: '8px', textAlign: 'center' }}>
        <p style={{ margin: 0, fontSize: '8.5px', color: '#bbb', letterSpacing: '0.04em' }}>
          FUNDACIÓN MISIÓN NEVADO · SISCVI v1.0 · Documento generado el {emision} · Solo válido con sello institucional
        </p>
      </div>
    </div>
  );
}

function FieldCell({ label, value }) {
  return (
    <td style={{ padding: '4px 8px 10px 0', verticalAlign: 'top', width: '33%' }}>
      <p style={{ margin: '0 0 2px', fontSize: '9px', fontWeight: 'bold', color: '#999', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</p>
      <p style={{ margin: 0, fontSize: '12px', color: '#222', fontWeight: '500' }}>{value}</p>
    </td>
  );
}

function Block({ label, value, borderColor, bg }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      {label && (
        <p style={{ margin: '0 0 3px', fontSize: '9px', color: '#888', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 'bold' }}>{label}</p>
      )}
      <p style={{ margin: 0, fontSize: '12.5px', color: '#333', lineHeight: '1.65', background: bg, padding: '10px 14px', borderRadius: '4px', borderLeft: `3px solid ${borderColor}` }}>
        {value ?? '—'}
      </p>
    </div>
  );
}
