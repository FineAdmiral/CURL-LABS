const yearSelect = document.querySelector("#year-select");
const monthSelect = document.querySelector("#month-select");
const previousButton = document.querySelector("#previous-month");
const nextButton = document.querySelector("#next-month");
const calendarGrid = document.querySelector("#calendar-grid");
const weekdayHeadings = document.querySelector("#weekday-headings");
const monthSummary = document.querySelector("#month-summary");
const selectedDatePanel = document.querySelector("#selected-date");
const eventList = document.querySelector("#event-list");
const eventCount = document.querySelector("#event-count");
const statusMessage = document.querySelector("#status-message");

const years = ["2082", "2083"];
const weekdayNames = [
  "आइतबार",
  "सोमबार",
  "मंगलबार",
  "बुधबार",
  "बिहीबार",
  "शुक्रबार",
  "शनिबार",
];
const englishWeekdays = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const state = {
  calendars: {},
  year: "2082",
  month: "1",
  day: "1",
};

function getEnglishDate(dateString, options = {}) {
  const date = new Date(`${dateString}T00:00:00Z`);
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
    ...options,
  }).format(date);
}

function getMonth() {
  return state.calendars[state.year][state.month];
}

function getDay(dayNumber) {
  return getMonth().daysData[String(dayNumber)];
}

function getGregorianDate(dayNumber) {
  const date = new Date(`${getMonth().daysData["1"].engDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + Number(dayNumber) - 1);
  return date.toISOString().slice(0, 10);
}

function getEvents(day) {
  return Array.isArray(day.events) ? day.events : [];
}

function addTextElement(parent, tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  element.textContent = text;
  parent.append(element);
  return element;
}

function renderWeekdays() {
  weekdayHeadings.replaceChildren();
  weekdayNames.forEach((name, index) => {
    const heading = document.createElement("span");
    heading.textContent = name;
    heading.title = englishWeekdays[index];
    weekdayHeadings.append(heading);
  });
}

function renderMonthOptions() {
  const months = state.calendars[state.year];
  monthSelect.replaceChildren();
  Object.entries(months).forEach(([monthNumber, month]) => {
    const option = document.createElement("option");
    option.value = monthNumber;
    option.textContent = month.monthName;
    monthSelect.append(option);
  });
  monthSelect.value = state.month;
}

function renderCalendar() {
  const month = getMonth();
  const firstWeekday = new Date(`${getGregorianDate("1")}T00:00:00Z`).getUTCDay();
  const days = Object.entries(month.daysData);
  const daysWithEvents = days.filter(([, day]) => getEvents(day).length > 0).length;

  monthSummary.textContent = `${month.days} days · ${daysWithEvents} dates with events`;
  calendarGrid.replaceChildren();

  for (let index = 0; index < firstWeekday; index += 1) {
    const blank = document.createElement("div");
    blank.className = "calendar-blank";
    blank.setAttribute("aria-hidden", "true");
    calendarGrid.append(blank);
  }

  days.forEach(([dayNumber, day]) => {
    const button = document.createElement("button");
    const events = getEvents(day);
    const isSelected = dayNumber === state.day;
    button.type = "button";
    button.className = "calendar-day";
    if (isSelected) button.classList.add("is-selected");
    if (day.holiday) button.classList.add("is-holiday");
    if (events.length) button.classList.add("has-event");
    button.setAttribute("aria-pressed", String(isSelected));
    button.setAttribute(
      "aria-label",
      `${state.year}-${state.month.padStart(2, "0")}-${dayNumber.padStart(2, "0")}, ${englishWeekdays[new Date(`${getGregorianDate(dayNumber)}T00:00:00Z`).getUTCDay()]}${day.tithi ? `, tithi ${day.tithi}` : ""}${events.length ? `, ${events.map((event) => event.title).join(", ")}` : ""}`,
    );

    addTextElement(button, "span", "bs-date", dayNumber);
    addTextElement(button, "span", "ad-date", getEnglishDate(getGregorianDate(dayNumber)));
    if (day.tithi) addTextElement(button, "span", "tithi", `तिथि ${day.tithi}`);
    if (events.length) {
      const marker = document.createElement("span");
      marker.className = "event-marker";
      marker.setAttribute("aria-hidden", "true");
      button.append(marker);
    }

    button.addEventListener("click", () => {
      state.day = dayNumber;
      renderCalendar();
    });
    calendarGrid.append(button);
  });

  previousButton.disabled = state.year === years[0] && state.month === "1";
  nextButton.disabled = state.year === years[years.length - 1] && state.month === "12";
  renderSelectedDate();
  renderEvents();
}

function renderSelectedDate() {
  const day = getDay(state.day);
  const gregorianDate = getGregorianDate(state.day);
  selectedDatePanel.replaceChildren();
  addTextElement(
    selectedDatePanel,
    "p",
    "selected-date-label",
    `${state.year} BS · ${getMonth().monthName.split("(")[0].trim()} ${state.day}`,
  );
  addTextElement(
    selectedDatePanel,
    "h2",
    "selected-date-title",
    getEnglishDate(gregorianDate, { weekday: "long", year: "numeric" }),
  );
  addTextElement(
    selectedDatePanel,
    "p",
    "selected-date-meta",
    `${weekdayNames[new Date(`${gregorianDate}T00:00:00Z`).getUTCDay()]} · ${day.tithi ? `तिथि ${day.tithi}` : "Tithi unavailable"}`,
  );

  if (day.holiday) {
    addTextElement(selectedDatePanel, "span", "holiday-badge", "Public holiday");
  }

  const events = getEvents(day);
  if (!events.length) {
    addTextElement(selectedDatePanel, "p", "empty-note", "No event is listed for this date.");
    return;
  }

  const list = document.createElement("ul");
  list.className = "selected-events";
  events.forEach((event) => addTextElement(list, "li", "", event.title));
  selectedDatePanel.append(list);
}

function renderEvents() {
  const daysWithEvents = Object.entries(getMonth().daysData)
    .filter(([, day]) => getEvents(day).length > 0)
    .map(([dayNumber, day]) => ({ dayNumber, day }));
  eventCount.textContent = String(daysWithEvents.length);
  eventList.replaceChildren();

  if (!daysWithEvents.length) {
    addTextElement(eventList, "p", "empty-note", "No events are listed for this month.");
    return;
  }

  daysWithEvents.forEach(({ dayNumber, day }) => {
    const item = document.createElement("button");
    item.type = "button";
    item.className = "event-item";
    item.addEventListener("click", () => {
      state.day = dayNumber;
      renderCalendar();
    });

    const date = document.createElement("span");
    date.className = "event-date";
    addTextElement(date, "strong", "", dayNumber);
    addTextElement(date, "span", "", getEnglishDate(getGregorianDate(dayNumber)));
    item.append(date);

    const titles = document.createElement("span");
    titles.className = "event-titles";
    getEvents(day).forEach((event) => addTextElement(titles, "span", "", event.title));
    if (day.holiday) addTextElement(titles, "small", "holiday-label", "Holiday");
    item.append(titles);
    eventList.append(item);
  });
}

function changeMonth(offset) {
  let yearIndex = years.indexOf(state.year);
  let monthNumber = Number(state.month) + offset;
  if (monthNumber < 1) {
    yearIndex -= 1;
    monthNumber = 12;
  } else if (monthNumber > 12) {
    yearIndex += 1;
    monthNumber = 1;
  }
  if (yearIndex < 0 || yearIndex >= years.length) return;

  state.year = years[yearIndex];
  state.month = String(monthNumber);
  state.day = "1";
  yearSelect.value = state.year;
  renderMonthOptions();
  renderCalendar();
}

function showError(message) {
  statusMessage.hidden = false;
  statusMessage.textContent = message;
}

async function initialize() {
  try {
    const responses = await Promise.all(
      years.map((year) => fetch(`calendarData_${year}.json`)),
    );
    if (responses.some((response) => !response.ok)) {
      throw new Error("One or more calendar data files could not be loaded.");
    }
    const data = await Promise.all(responses.map((response) => response.json()));
    years.forEach((year, index) => {
      if (!data[index][year]) throw new Error(`Calendar data for ${year} is missing.`);
      state.calendars[year] = data[index][year];
    });

    renderWeekdays();
    renderMonthOptions();
    renderCalendar();
    statusMessage.hidden = true;
  } catch (error) {
    showError(
      `${error.message} Open this page through a local web server (for example, run “python -m http.server” in this folder) so the browser can read the JSON files.`,
    );
  }
}

yearSelect.addEventListener("change", () => {
  state.year = yearSelect.value;
  state.month = "1";
  state.day = "1";
  renderMonthOptions();
  renderCalendar();
});

monthSelect.addEventListener("change", () => {
  state.month = monthSelect.value;
  state.day = "1";
  renderCalendar();
});

previousButton.addEventListener("click", () => changeMonth(-1));
nextButton.addEventListener("click", () => changeMonth(1));

initialize();
