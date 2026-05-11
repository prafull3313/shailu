'use client';

import { useState, useEffect } from 'react';
import { getDaysWithEntries, saveDay, type DayData } from '../lib/days';

const rideOrderFromSuggestions = [
  'Umesh Sir',
  'Motherboard',
  'Kuldeep Padade',
  'Uber',
  'Ola'
];

export default function Home() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startKM, setStartKM] = useState('');
  const [endKM, setEndKM] = useState('');
  const [money, setMoney] = useState('');
  const [from, setFrom] = useState('');
  const [allData, setAllData] = useState<DayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadData = async () => {
    try {
      const days = await getDaysWithEntries();
      setAllData(days);
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
  }, []);

  const addEntry = async () => {
    setErrorMessage('');
    setSuccessMessage('');

    if (money && from && startKM && endKM) {
      const newEntry = { money: parseFloat(money), from };
      const existingDay = allData.find(d => d.date === date);
      const updatedEntries = [...(existingDay?.entries || []), newEntry];
      const updatedDay = {
        date,
        startKM: parseFloat(startKM),
        endKM: parseFloat(endKM),
        entries: updatedEntries,
      };

      try {
        const result = await saveDay(updatedDay, existingDay?.id);
        const savedDay = { id: result.id, ...updatedDay };
        const updatedData = existingDay
          ? allData.map(d => d.date === date ? savedDay : d)
          : [savedDay, ...allData];

        setAllData(updatedData.sort((a, b) => b.date.localeCompare(a.date)));
        setMoney('');
        setFrom('');
        setSuccessMessage(result.message);
      } catch (error) {
        console.error('Error saving data:', error);
        setErrorMessage(
          error instanceof Error ? error.message : 'Failed to save the entry.'
        );
      }
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
          <h1 className="mt-2 text-3xl font-bold">Target</h1>
          <p className="mt-2 max-w-2xl text-sm text-sky-50">
            Track kilometers, ride sources, and daily totals in one place.
          </p>
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
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Starting KM
              </span>
              <input
                type="number"
                value={startKM}
                onChange={(e) => setStartKM(e.target.value)}
                className="w-full rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">
                Ending KM
              </span>
              <input
                type="number"
                value={endKM}
                onChange={(e) => setEndKM(e.target.value)}
                className="w-full rounded-md border border-sky-200 bg-sky-50 px-3 py-2 text-slate-900 outline-none transition focus:border-sky-500 focus:bg-white focus:ring-2 focus:ring-sky-100"
              />
            </label>
          </div>
        </section>

        <section className="mb-6 rounded-lg border border-sky-100 bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Entries</h2>
              <p className="text-sm text-sky-700">Add each ride or order payment.</p>
            </div>
          </div>

          <div className="mb-5 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
            <input
              type="number"
              placeholder="Money received"
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
            <button
              onClick={addEntry}
              className="rounded-md bg-sky-600 px-5 py-2 font-semibold text-white shadow-sm transition hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-300"
            >
              Add
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-sky-100">
            <table className="min-w-[760px] w-full border-collapse bg-white text-sm">
              <thead>
                <tr className="bg-sky-100 text-sky-950">
                  <th className="px-3 py-3 text-left font-semibold">Date</th>
                  <th className="px-3 py-3 text-left font-semibold">Start KM</th>
                  <th className="px-3 py-3 text-left font-semibold">End KM</th>
                  <th className="px-3 py-3 text-left font-semibold">Money Received</th>
                  <th className="px-3 py-3 text-left font-semibold">Ride/Order From</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sky-100">
                {allData.flatMap((day) =>
                  day.entries.map((entry, entryIndex) => (
                    <tr className="odd:bg-white even:bg-sky-50/60" key={`${day.date}-${entryIndex}`}>
                      <td className="px-3 py-3">{formatDate(day.date)}</td>
                      <td className="px-3 py-3">{day.startKM}</td>
                      <td className="px-3 py-3">{day.endKM}</td>
                      <td className="px-3 py-3 font-semibold text-emerald-700">Rs.{entry.money}</td>
                      <td className="px-3 py-3">{entry.from}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
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
