'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { getDaysWithEntries, type DayData, type Entry } from '../../lib/days';

type PaymentEntry = Entry & {
  date: string;
};

const formatDate = (dateStr: string) => {
  const [year, month, day] = dateStr.split('-');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return `${day}-${monthNames[parseInt(month) - 1]}-${year}`;
};

const getTotal = (entries: Entry[]) =>
  entries.reduce((sum, entry) => sum + entry.money, 0);

const PaymentTable = ({
  entries,
  emptyMessage
}: {
  entries: Entry[];
  emptyMessage: string;
}) => {
  if (entries.length === 0) {
    return (
      <p className="rounded-md border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-sky-100">
      <table className="w-full min-w-[560px] border-collapse bg-white text-sm">
        <thead>
          <tr className="bg-sky-100 text-sky-950">
            <th className="px-3 py-3 text-left font-semibold">Ride/Order From</th>
            <th className="px-3 py-3 text-left font-semibold">Amount</th>
            <th className="px-3 py-3 text-left font-semibold">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-sky-100">
          {entries.map((entry, entryIndex) => (
            <tr className="odd:bg-white even:bg-sky-50/60" key={`${entry.from}-${entryIndex}`}>
              <td className="px-3 py-3">{entry.from}</td>
              <td className="px-3 py-3 font-semibold text-emerald-700">Rs.{entry.money}</td>
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default function PaymentsPage() {
  const [allData, setAllData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentPageIndex, setCurrentPageIndex] = useState(0);

  const loadData = async () => {
    try {
      setLoading(true);
      const days = await getDaysWithEntries();

      setAllData(days);
      setErrorMessage('');
    } catch (error) {
      console.error('Error loading payments:', error);
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to load payment details.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadData();
  }, []);

  const entries = useMemo(
    () =>
      allData.flatMap((day) =>
        day.entries.map((entry) => ({
          ...entry,
          date: day.date
        }))
      ),
    [allData]
  );

  const receivedEntries = entries.filter((entry) => entry.paymentReceived);
  const notReceivedEntries = entries.filter((entry) => !entry.paymentReceived);
  const totalPages = allData.length;
  const currentDay = allData[currentPageIndex];
  const currentDayEntries = currentDay ? currentDay.entries : [];
  const currentDayReceivedEntries = currentDayEntries.filter(
    (entry) => entry.paymentReceived
  );
  const currentDayNotReceivedEntries = currentDayEntries.filter(
    (entry) => !entry.paymentReceived
  );

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

  useEffect(() => {
    if (currentPageIndex >= allData.length && allData.length > 0) {
      setCurrentPageIndex(allData.length - 1);
    }
  }, [allData, currentPageIndex]);

  if (loading) {
    return (
      <main className="min-h-screen bg-sky-50 px-4 py-8 text-slate-900">
        <div className="mx-auto max-w-5xl rounded-lg border border-sky-100 bg-white p-6 shadow-sm">
          <p className="text-sky-700">Loading payments...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-sky-50 px-4 py-6 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="mb-6 rounded-lg bg-sky-600 px-5 py-6 text-white shadow-sm sm:px-7">
          <p className="text-sm font-medium uppercase tracking-wide text-sky-100">
            Payment details
          </p>
          <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold">Payments</h1>
              <p className="mt-2 max-w-2xl text-sm text-sky-50">
                Review received and pending ride or order payments.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Link
                href="/"
                className="rounded-md bg-sky-900 px-4 py-2 text-center text-sm font-semibold text-white shadow-sm transition hover:bg-sky-950 focus:outline-none focus:ring-2 focus:ring-white/60"
              >
                Back
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

        <section className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-sky-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-sky-700">Received</p>
            <p className="mt-3 text-3xl font-bold text-slate-950">Rs.{getTotal(receivedEntries)}</p>
            <p className="mt-1 text-sm text-slate-500">{receivedEntries.length} entries</p>
          </div>
          <div className="rounded-lg border border-sky-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-sky-700">Not Received</p>
            <p className="mt-3 text-3xl font-bold text-slate-950">Rs.{getTotal(notReceivedEntries)}</p>
            <p className="mt-1 text-sm text-slate-500">{notReceivedEntries.length} entries</p>
          </div>
          <div className="rounded-lg border border-sky-100 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-sky-700">Total</p>
            <p className="mt-3 text-3xl font-bold text-slate-950">Rs.{getTotal(entries)}</p>
            <p className="mt-1 text-sm text-slate-500">{entries.length} entries</p>
          </div>
        </section>

        <section className="rounded-lg border border-sky-100 bg-white p-5 shadow-sm sm:p-6">
          {totalPages === 0 ? (
            <p className="rounded-md border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-700">
              No payment records found.
            </p>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between rounded-md bg-sky-50 px-4 py-3">
                <div className="text-sm font-medium text-slate-700">
                  {currentDay ? (
                    <span>
                      Showing payments for <strong>{formatDate(currentDay.date)}</strong>
                    </span>
                  ) : null}
                </div>
                <div className="text-sm text-slate-600">
                  Page {currentPageIndex + 1} of {totalPages}
                </div>
              </div>

              <div className="mb-5 grid gap-4 sm:grid-cols-3">
                <div className="rounded-md bg-emerald-50 px-4 py-3">
                  <p className="text-sm font-semibold text-emerald-700">Day Received</p>
                  <p className="mt-1 text-xl font-bold text-slate-950">
                    Rs.{getTotal(currentDayReceivedEntries)}
                  </p>
                </div>
                <div className="rounded-md bg-amber-50 px-4 py-3">
                  <p className="text-sm font-semibold text-amber-700">Day Not Received</p>
                  <p className="mt-1 text-xl font-bold text-slate-950">
                    Rs.{getTotal(currentDayNotReceivedEntries)}
                  </p>
                </div>
                <div className="rounded-md bg-sky-50 px-4 py-3">
                  <p className="text-sm font-semibold text-sky-700">Day Total</p>
                  <p className="mt-1 text-xl font-bold text-slate-950">
                    Rs.{getTotal(currentDayEntries)}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-slate-900">Payments Received</h2>
                  <p className="text-sm text-sky-700">Completed payments for this day.</p>
                </div>
                <PaymentTable
                  entries={currentDayReceivedEntries}
                  emptyMessage="No received payments found for this day."
                />
              </div>

              <div>
                <div className="mb-4">
                  <h2 className="text-xl font-bold text-slate-900">Payments Not Received</h2>
                  <p className="text-sm text-sky-700">Pending payments for this day.</p>
                </div>
                <PaymentTable
                  entries={currentDayNotReceivedEntries}
                  emptyMessage="No pending payments found for this day."
                />
              </div>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-2">
                  <button
                    onClick={handlePreviousPage}
                    disabled={currentPageIndex === 0}
                    className="rounded-md border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  >
                    Previous
                  </button>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPageIndex === totalPages - 1}
                    className="rounded-md border border-sky-200 bg-white px-4 py-2 text-sm font-semibold text-sky-700 transition hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  >
                    Next
                  </button>
                </div>
                <select
                  value={currentPageIndex}
                  onChange={(event) => goToPage(Number(event.target.value))}
                  className="rounded-md border border-sky-200 bg-white px-3 py-2 text-sm font-semibold text-sky-700 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                >
                  {allData.map((day, index) => (
                    <option key={day.id} value={index}>
                      {formatDate(day.date)}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}
