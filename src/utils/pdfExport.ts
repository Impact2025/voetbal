import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Player } from '../types';
import { skillKeys } from './constants';

const NEON = [0, 255, 157] as const;

export function exportPlayerPdf(player: Player, teamName: string, periods: string[]): void {
  const doc = new jsPDF();
  const today = new Date().toLocaleDateString('nl-NL', { day: '2-digit', month: 'long', year: 'numeric' });

  // Header
  doc.setFillColor(13, 13, 13);
  doc.rect(0, 0, 210, 32, 'F');
  doc.setTextColor(...NEON);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('SKILLKAART', 14, 14);
  doc.setFontSize(10);
  doc.setTextColor(180, 180, 180);
  doc.text(teamName, 14, 22);
  doc.text(`Gegenereerd op ${today}`, 14, 28);

  // Speler info
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(player.name, 14, 44);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150, 150, 150);
  const info = [player.position, player.age ? `${player.age} jaar` : '', player.preferred_foot ? `Voet: ${player.preferred_foot}` : ''].filter(Boolean).join('  ·  ');
  doc.text(info, 14, 51);

  // Skills tabel
  doc.setTextColor(0, 255, 157);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Skillscores per periode', 14, 63);

  const skillHead = ['Skill', ...periods, 'Trend'];
  const skillBody = skillKeys.map(key => {
    const values = periods.map(p => String(player.evaluations?.[p]?.skills?.[key] ?? '-'));
    const nums = values.map(v => Number(v)).filter(n => !isNaN(n));
    const trend = nums.length >= 2 ? (nums[nums.length - 1] > nums[0] ? '↑' : nums[nums.length - 1] < nums[0] ? '↓' : '→') : '-';
    return [key.charAt(0).toUpperCase() + key.slice(1), ...values, trend];
  });

  autoTable(doc, {
    startY: 67,
    head: [skillHead],
    body: skillBody,
    theme: 'grid',
    headStyles: { fillColor: [0, 255, 157], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fillColor: [26, 26, 26], textColor: [220, 220, 220], fontSize: 9 },
    alternateRowStyles: { fillColor: [35, 35, 35] },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 35 } },
  });

  // Wedstrijdcijfers
  const finalY1 = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  doc.setTextColor(0, 255, 157);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Wedstrijdcijfers', 14, finalY1);

  autoTable(doc, {
    startY: finalY1 + 4,
    head: [['Periode', 'Wedstrijdcijfer', 'Gem. Skill']],
    body: periods.map(p => {
      const ev = player.evaluations?.[p];
      const avg = ev ? (skillKeys.reduce((s, k) => s + (ev.skills[k] ?? 0), 0) / skillKeys.length).toFixed(1) : '-';
      return [p, String(ev?.matchRating ?? '-'), avg];
    }),
    theme: 'grid',
    headStyles: { fillColor: [0, 255, 157], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fillColor: [26, 26, 26], textColor: [220, 220, 220], fontSize: 9 },
  });

  // Coach opmerkingen per periode
  const finalY2 = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 8;
  let curY = finalY2;

  for (const period of periods) {
    const ev = player.evaluations?.[period];
    if (!ev?.comments && !ev?.trainingPlan) continue;

    if (curY > 240) { doc.addPage(); curY = 20; }

    doc.setTextColor(0, 255, 157);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(period, 14, curY);
    curY += 6;

    if (ev.comments) {
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('Opmerkingen coach:', 14, curY);
      curY += 5;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(220, 220, 220);
      const commentLines = doc.splitTextToSize(ev.comments, 180);
      doc.text(commentLines, 14, curY);
      curY += commentLines.length * 4.5 + 3;
    }

    if (ev.trainingPlan) {
      if (curY > 250) { doc.addPage(); curY = 20; }
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('Trainingsplan:', 14, curY);
      curY += 5;
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(220, 220, 220);
      const planLines = doc.splitTextToSize(ev.trainingPlan, 180);
      doc.text(planLines, 14, curY);
      curY += planLines.length * 4.5 + 6;
    }
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text(`Skillkaart — ${teamName} — Pagina ${i} van ${pageCount}`, 14, 290);
  }

  doc.save(`${player.name.replace(/\s+/g, '_')}_Skillkaart.pdf`);
}
