/**
 * Leeftijdscategorieën in het jeugdvoetbal (O8..O12) volgen het geboortejaar,
 * niet de exacte verjaardag — vandaar dat we rekenen met het kalenderjaar in
 * plaats van een exacte leeftijdsberekening.
 */
export function ageFromBirthYear(birthYear: number): number {
  return new Date().getFullYear() - birthYear;
}

/**
 * Herberekent player.age uit birth_year wanneer die bekend is, zodat leeftijd
 * niet elk seizoen handmatig bijgewerkt hoeft te worden. Spelers zonder
 * birth_year (nog niet gemigreerd) vallen terug op het bestaande age-veld.
 */
export function withComputedAge<T extends { birth_year?: number | null; age?: string | null }>(row: T): T {
  if (row.birth_year) return { ...row, age: String(ageFromBirthYear(row.birth_year)) };
  return row;
}
