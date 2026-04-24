import { useState, useEffect, useCallback } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import { getExpenses, getSalaryDb } from '../database/db';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export const useExpenses = () => {
    const db = useSQLiteContext();
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalSpent, setTotalSpent] = useState(0);
    const [spentToday, setSpentToday] = useState(0);
    const [salary, setSalary] = useState(0);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getExpenses(db);
            setExpenses(data);

            const mSalary = await getSalaryDb(db);
            setSalary(mSalary);

            const start = startOfMonth(new Date());
            const end = endOfMonth(new Date());

            // Filter monthly totals in JS for stability
            const monthlyData = data.filter(item => {
                const itemDate = new Date(item.date);
                return itemDate >= start && itemDate <= end;
            });

            const total = monthlyData.reduce((sum, item) => sum + item.amount, 0);
            setTotalSpent(total);

            const todayStr = format(new Date(), 'yyyy-MM-dd');
            const todayTotal = data
                .filter(item => item.date.startsWith(todayStr))
                .reduce((sum, item) => sum + item.amount, 0);
            setSpentToday(todayTotal);
        } catch (e) {
            console.error('Hook load error:', e);
        } finally {
            setLoading(false);
        }
    }, [db]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    return {
        expenses,
        totalSpent,
        spentToday,
        salary,
        loading,
        remainingBalance: salary - totalSpent,
        refreshExpenses: loadData
    };
};
