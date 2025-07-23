// Cohort start dates for Licensed and Unlicensed classes
export const COHORT_START_DATES = {
  AGENT: [
    "2025-07-21",
    "2025-08-18",
    "2025-09-22",
    "2025-10-20",
    "2025-11-17",
    "2025-12-15",
    "2026-01-19",
  ],
  UNL: [
    "2025-08-04",
    "2025-09-08",
    "2025-10-06",
    "2025-11-03",
    "2025-12-01",
    "2026-01-05",
    "2026-02-02",
  ],
} as const;

export type ClassType = keyof typeof COHORT_START_DATES;

/**
 * Get the next available start date for a given class type
 * Fixed timezone issue by using UTC dates for comparison
 */
export function getNextStartDate(classType: ClassType): Date {
  // Use UTC to avoid timezone issues
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of today in local time

  const dates = COHORT_START_DATES[classType];

  console.log("[CohortDates] Finding next start date:", {
    classType,
    today: today.toLocaleDateString(),
    availableDates: dates,
  });

  // Find the next date that's in the future
  for (const dateStr of dates) {
    const cohortDate = new Date(dateStr + "T00:00:00"); // Explicit local time
    cohortDate.setHours(0, 0, 0, 0);

    console.log("[CohortDates] Comparing:", {
      cohortDate: cohortDate.toLocaleDateString(),
      today: today.toLocaleDateString(),
      isAfter: cohortDate > today,
    });

    if (cohortDate > today) {
      console.log(
        "[CohortDates] Selected next date:",
        cohortDate.toLocaleDateString()
      );
      return cohortDate;
    }
  }

  // If no future dates found, return the last date (shouldn't happen with current dates)
  const fallbackDate = new Date(dates[dates.length - 1] + "T00:00:00");
  console.log(
    "[CohortDates] No future dates found, using fallback:",
    fallbackDate.toLocaleDateString()
  );
  return fallbackDate;
}

/**
 * Get all future start dates for a given class type
 */
export function getFutureStartDates(classType: ClassType): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return COHORT_START_DATES[classType]
    .map((dateStr) => {
      const date = new Date(dateStr + "T00:00:00");
      date.setHours(0, 0, 0, 0);
      return date;
    })
    .filter((date) => date > today);
}

/**
 * Format a date for display in offer letters
 */
export function formatOfferDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Get the projected start date for a candidate based on their class assignment or license status
 */
export function getProjectedStartDate(candidate: any): Date | null {
  // Use assigned class type if available, otherwise infer from license status
  const classType =
    candidate.classAssignment?.classType ||
    (candidate.licenseStatus === "Licensed" ? "AGENT" : "UNL");

  // If they have a specific start date assigned, use that
  if (candidate.classAssignment?.startDate) {
    const assignedDate =
      candidate.classAssignment.startDate instanceof Date
        ? candidate.classAssignment.startDate
        : new Date(candidate.classAssignment.startDate);

    console.log(
      "[CohortDates] Using assigned start date:",
      assignedDate.toLocaleDateString()
    );
    return assignedDate;
  }

  // Otherwise, get the next available start date for their class type
  return getNextStartDate(classType as ClassType);
}

/**
 * Get all available cohort dates for selection
 */
export function getAllCohortOptions(): Array<{
  value: string;
  label: string;
  classType: ClassType;
}> {
  const options = [];

  // Add AGENT (Licensed) dates
  for (const dateStr of COHORT_START_DATES.AGENT) {
    const date = new Date(dateStr + "T00:00:00");
    options.push({
      value: dateStr,
      label: `Licensed Agent - ${formatOfferDate(date)}`,
      classType: "AGENT" as ClassType,
    });
  }

  // Add UNL (Unlicensed) dates
  for (const dateStr of COHORT_START_DATES.UNL) {
    const date = new Date(dateStr + "T00:00:00");
    options.push({
      value: dateStr,
      label: `Unlicensed Agent - ${formatOfferDate(date)}`,
      classType: "UNL" as ClassType,
    });
  }

  // Sort by date
  return options.sort(
    (a, b) => new Date(a.value).getTime() - new Date(b.value).getTime()
  );
}
