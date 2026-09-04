export const MINIMUM_AGE_YEARS = 18;

export type DateOfBirth = { year: number; month: number; day: number };

export function isAtLeastAge(
  dob: DateOfBirth,
  minimumAge: number = MINIMUM_AGE_YEARS,
  now: Date = new Date()
): boolean {
  const birthDate = new Date(Date.UTC(dob.year, dob.month - 1, dob.day));
  let age = now.getUTCFullYear() - birthDate.getUTCFullYear();
  const hadBirthdayThisYear =
    now.getUTCMonth() > birthDate.getUTCMonth() ||
    (now.getUTCMonth() === birthDate.getUTCMonth() && now.getUTCDate() >= birthDate.getUTCDate());
  if (!hadBirthdayThisYear) age -= 1;
  return age >= minimumAge;
}
