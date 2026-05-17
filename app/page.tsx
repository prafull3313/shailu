'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  deleteDay,
  getDaysWithEntries,
  saveDay,
  type DayData,
  type Entry
} from '../lib/days';
import {
  getRideOrderFromSuggestions,
  saveRideOrderFromSuggestion
} from '../lib/metadata';

type EditingEntry = {
  dayId: string;
  date: string;
  entryIndex: number;
};

const sortDaysByDateDesc = (days: DayData[]) =>
  [...days].sort((a, b) => b.date.localeCompare(a.date));

export default function Home() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [money, setMoney] = useState('');
  const [from, setFrom] = useState('');
  const [paymentReceived, setPaymentReceived] = useState(false);
  const [allData, setAllData] = useState<DayData[]>([]);
  const [rideOrderFromSuggestions, setRideOrderFromSuggestions] = useState<string[]>([]);
  const [editingEntry, setEditingEntry] = useState<EditingEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPageIndex, setCurrentPageIndex] = useState(0);



  const loadData = async () => {
    try {
      setLoading(true);
      const [days, suggestions] = await Promise.all([
        getDaysWithEntries(),
        getRideOrderFromSuggestions()
      ]);
      setAllData(days);
      setRideOrderFromSuggestions(suggestions.sort((a, b) => a.localeCompare(b)));
      setErrorMessage('');
    } catch (error) {
      console.error('Error loading data:', error);
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to load saved entries.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveSuggestionIfNew = async (fromValue: string) => {
    const isNewSuggestion = !rideOrderFromSuggestions.some(
      (suggestion) => suggestion.toLowerCase() === fromValue.toLowerCase()
    );

    if (!isNewSuggestion) {
      return;
    }

    await saveRideOrderFromSuggestion(fromValue);
    setRideOrderFromSuggestions((suggestions) =>
      [...suggestions, fromValue].sort((a, b) => a.localeCompare(b))
    );
  };

  const resetEntryForm = () => {
    setMoney('');
    setFrom('');
    setPaymentReceived(false);
    setEditingEntry(null);
  };

  const selectDate = (selectedDate: string) => {
    setDate(selectedDate);
  };

  const saveEntry = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    const fromValue = from.trim();

    if (money && fromValue) {
      const nextEntry: Entry = {
        money: parseFloat(money),
        from: fromValue,
        paymentReceived
      };
      const existingDay = allData.find(d => d.date === date);
      const nextDayBase = {
        date
      };

      try {
        if (editingEntry) {
          const originalDay = allData.find((day) => day.id === editingEntry.dayId);

          if (!originalDay) {
            setErrorMessage('Could not find the record to update.');
            return;
          }

          if (editingEntry.date === date) {
            const updatedDay = {
              date,
              entries: originalDay.entries.map((entry, entryIndex) =>
                entryIndex === editingEntry.entryIndex ? nextEntry : entry
              )
            };
            const result = await saveDay(updatedDay, originalDay.id);
            const savedDay = { id: result.id, ...updatedDay };

            setAllData((days) =>
              sortDaysByDateDesc(
                days.map((day) => (day.id === originalDay.id ? savedDay : day))
              )
            );
          } else {
            const remainingEntries = originalDay.entries.filter(
              (_, entryIndex) => entryIndex !== editingEntry.entryIndex
            );
            const targetDay = allData.find((day) => day.date === date);
            const targetUpdatedDay = {
              date,
              entries: [...(targetDay?.entries || []), nextEntry]
            };
            const targetResult = await saveDay(targetUpdatedDay, targetDay?.id);
            const savedTargetDay = { id: targetResult.id, ...targetUpdatedDay };

            if (remainingEntries.length > 0) {
              await saveDay(
                {
                  date: originalDay.date,
                  entries: remainingEntries
                },
                originalDay.id
              );
            } else {
              await deleteDay(originalDay.id);
            }

            setAllData((days) => {
              const withoutOriginal = remainingEntries.length > 0
                ? days.map((day) =>
                    day.id === originalDay.id
                      ? { ...originalDay, entries: remainingEntries }
                      : day
                  )
                : days.filter((day) => day.id !== originalDay.id);
              const withTarget = targetDay
                ? withoutOriginal.map((day) =>
                    day.id === targetDay.id ? savedTargetDay : day
                  )
                : [savedTargetDay, ...withoutOriginal];

              return sortDaysByDateDesc(withTarget);
            });
          }

          await saveSuggestionIfNew(fromValue);
          resetEntryForm();
          setSuccessMessage('Record updated successfully.');
          return;
        }

        const updatedDay = {
          ...nextDayBase,
          entries: [...(existingDay?.entries || []), nextEntry],
        };
        const result = await saveDay(updatedDay, existingDay?.id);
        await saveSuggestionIfNew(fromValue);

        const savedDay = { id: result.id, ...updatedDay };
        const updatedData = existingDay
          ? allData.map(d => d.date === date ? savedDay : d)
          : [savedDay, ...allData];

        setAllData(sortDaysByDateDesc(updatedData));
        setMoney('');
        setFrom('');
        setPaymentReceived(false);
        setSuccessMessage(result.message);
      } catch (error) {
        console.error('Error saving data:', error);
        setErrorMessage(
          error instanceof Error ? error.message : 'Failed to save the entry.'
        );
      }
    }
  };

  const editRecord = (day: DayData, entryIndex: number) => {
    const entry = day.entries[entryIndex];

    if (!entry) {
      return;
    }

    setDate(day.date);
    setMoney(String(entry.money));
    setFrom(entry.from);
    setPaymentReceived(entry.paymentReceived);
    setEditingEntry({
      dayId: day.id,
      date: day.date,
      entryIndex
    });
    setErrorMessage('');
    setSuccessMessage('');
  };

  const deleteRecord = async (day: DayData, entryIndex: number) => {
    const shouldDelete = window.confirm('Delete this record?');

    if (!shouldDelete) {
      return;
    }

    setErrorMessage('');
    setSuccessMessage('');

    const remainingEntries = day.entries.filter((_, index) => index !== entryIndex);

    try {
      if (remainingEntries.length > 0) {
        const updatedDay = {
          date: day.date,
          entries: remainingEntries
        };

        await saveDay(updatedDay, day.id);
        setAllData((days) =>
          sortDaysByDateDesc(
            days.map((currentDay) =>
              currentDay.id === day.id ? { id: day.id, ...updatedDay } : currentDay
            )
          )
        );
      } else {
        await deleteDay(day.id);
        setAllData((days) => days.filter((currentDay) => currentDay.id !== day.id));
      }

      if (
        editingEntry?.dayId === day.id &&
        editingEntry.entryIndex === entryIndex
      ) {
        resetEntryForm();
      }

      setSuccessMessage('Record deleted successfully.');
    } catch (error) {
      console.error('Error deleting record:', error);
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to delete the record.'
      );
    }
  };

  const calculateDaySums = () => {
    return allData.map(day => ({
      date: day.date,
      sum: day.entries.reduce((sum, entry) => sum + entry.money, 0),
    }));
  };

  const calculateMonthSums = () => {
    const monthMap: { [key: string]: number } = {};
    allData.forEach(day => {
      const month = day.date.substring(0, 7); // YYYY-MM
      const sum = day.entries.reduce((sum, entry) => sum + entry.money, 0);
      monthMap[month] = (monthMap[month] || 0) + sum;
    });
    return Object.entries(monthMap).map(([month, sum]) => ({ month, sum }));
  };

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${day}-${monthNames[parseInt(month) - 1]}-${year}`;
  };

  const formatMonth = (monthStr: string) => {
    const [year, month] = monthStr.split('-');
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${monthNames[parseInt(month) - 1]}-${year}`;
  };

  const daySums = calculateDaySums();
  const monthSums = calculateMonthSums();

  const totalPages = allData.length;
  const currentDay = allData[currentPageIndex];
  const currentDayEntries = currentDay ? currentDay.entries : [];

  const handlePreviousPage = () => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPageIndex < totalPages - 1) {
      setCurrentPageIndex(currentPageIndex + 1);
    }
  };

  const goToPage = (index: number) => {
    if (index >= 0 && index < totalPages) {
      setCurrentPageIndex(index);
    }
  };

  // Reset pagination when data changes
  useEffect(() => {
    if (currentPageIndex >= allData.length && allData.length > 0) {
      setCurrentPageIndex(allData.length - 1);
    }
  }, [allData, currentPageIndex]);

  if (loading) {
    return (
      <div className="min-h-screen bg-sky-50 px-4 py-8 text-slate-900">
        <div className="mx-auto max-w-5xl rounded-lg border border-sky-100 bg-white p-6 shadow-sm">
          <p className="text-sky-700">Loading Target...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-sky-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 rounded-lg bg-sky-600 px-5 py-6 text-white shadow-sm sm:px-7">
          <p className="text-sm font-medium uppercase tracking-wide text-sky-100">
            Ride earnings tracker
          </p>
          <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Target</h1>
              <p className="mt-2 max-w-2xl text-sm text-sky-50">
                Track kilometers, ride sources, and daily totals in one place.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href="/payments"
                className="rounded-md bg-sky-900 px-4 py-2 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-sky-950 focus:outline-none focus:ring-2 focus:ring-white/60"
              >
                Payments
              </Link>
              <button
                onClick={() => void loadData()}
                className="rounded-md bg-white px-4 py-2 text-sm font-semibold text-sky-700 shadow-sm transition hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-white/60"
              >
                Reload
              </button>
            </div>
          </div>
        </header>

        {errorMessage ? (
          <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorMessage}
          </p>
        ) : null}
        {successMessage ? (
          <p className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {successMessage}
          </p>
        ) : null}

        <section className="mb-6 rounded-lg border border-sky-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">Date</span>
              <input
                type="date"
                value={date}
                onChange={(e) => selectDate(e.target.value)}
                className="w-full rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
              />
            </label>
          </div>
        </section>



        <section className="mb-6 rounded-lg border border-sky-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Entries</h2>
              <p className="text-sm text-sky-700">
                {editingEntry ? 'Update the selected ride or order payment.' : 'Add each ride or order payment.'}
              </p>
            </div>
          </div>

          <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto_auto]">
            <input
              type="number"
              placeholder="How much money?"
              value={money}
              onChange={(e) => setMoney(e.target.value)}
              className="w-full rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
            />
            <input
              type="text"
              list="ride-order-from-suggestions"
              placeholder="Ride/order from"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
            />
            <datalist id="ride-order-from-suggestions">
              {rideOrderFromSuggestions.map((suggestion) => (
                <option key={suggestion} value={suggestion} />
              ))}
            </datalist>
            <label className="flex min-h-10 items-center gap-2 rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-sm font-semibold text-slate-700">
              <input
                type="checkbox"
                checked={paymentReceived}
                onChange={(e) => setPaymentReceived(e.target.checked)}
                className="h-4 w-4 accent-sky-600"
              />
              Payment received
            </label>
            <button
              onClick={saveEntry}
              className="rounded-md bg-sky-600 px-5 py-2 font-semibold text-white shadow-sm transition hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-300"
            >
              {editingEntry ? 'Update' : 'Add'}
            </button>
            {editingEntry ? (
              <button
                onClick={resetEntryForm}
                className="rounded-md border border-sky-200 bg-white px-5 py-2 font-semibold text-sky-700 shadow-sm transition hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-200"
              >
                Cancel
              </button>
            ) : null}
          </div>

          {totalPages === 0 ? (
            <p className="rounded-md border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">No entries found.</p>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between rounded-md bg-sky-50 px-4 py-3">
                <div className="text-sm font-medium text-slate-700">
                  {currentDay ? (
                    <span>
                      Showing entries for <strong>{formatDate(currentDay.date)}</strong>
                    </span>
                  ) : null}
                </div>
                <div className="text-sm text-slate-600">
                  Page {currentPageIndex + 1} of {totalPages}
                </div>
              </div>

              <div className="overflow-x-auto rounded-lg border border-sky-100">
                <table className="min-w-[720px] w-full border-collapse bg-white text-sm">
                  <thead>
                    <tr className="bg-sky-100 text-sky-950">
                      <th className="px-3 py-3 text-left font-semibold">How much money?</th>
                      <th className="px-3 py-3 text-left font-semibold">Ride/Order From</th>
                      <th className="px-3 py-3 text-left font-semibold">Payment</th>
                      <th className="px-3 py-3 text-left font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sky-100">
                    {currentDayEntries.map((entry, entryIndex) => (
                      <tr className="odd:bg-white even:bg-sky-50/60" key={`${currentDay?.date}-${entryIndex}`}>
                        <td className="px-3 py-3 font-semibold text-emerald-700">Rs.{entry.money}</td>
                        <td className="px-3 py-3">{entry.from}</td>
                        <td className="px-3 py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              entry.paymentReceived
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {entry.paymentReceived ? 'Received' : 'Not received'}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex gap-2">
                            <button
                              onClick={() => currentDay && editRecord(currentDay, entryIndex)}
                              className="rounded-md border border-sky-200 bg-white px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-50 focus:outline-none focus:ring-2 focus:ring-sky-200"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => currentDay && deleteRecord(currentDay, entryIndex)}
                              className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-200"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-2">
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPageIndex === 0}
                    className="rounded-md border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  >
                    ← Previous
                  </button>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPageIndex === totalPages - 1}
                    className="rounded-md border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  >
                    Next →
                  </button>
                </div>
              </div>
            </>
          )}
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-sky-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-sky-700">Day Total</p>
            <p className="mt-1 text-sm text-slate-500">{formatDate(date)}</p>
            <p className="mt-3 text-3xl font-bold text-slate-950">
              Rs.{daySums.find(d => d.date === date)?.sum || 0}
            </p>
          </div>
          <div className="rounded-lg border border-sky-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-sky-700">Month Total</p>
            <p className="mt-1 text-sm text-slate-500">{formatMonth(date.substring(0, 7))}</p>
            <p className="mt-3 text-3xl font-bold text-slate-950">
              Rs.{monthSums.find(m => m.month === date.substring(0, 7))?.sum || 0}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
