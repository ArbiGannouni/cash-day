import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/client';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export const useExpenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalSpent, setTotalSpent] = useState(0);
    const [spentToday, setSpentToday] = useState(0);
    const [salary, setSalary] = useState(0);
    const [incomes, setIncomes] = useState([]);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await apiClient.getExpenses();
            setExpenses(data);

            const mSalary = await apiClient.getSalary();
            setSalary(mSalary);

            const incData = await apiClient.getIncomes();
            setIncomes(incData);

            const start = startOfMonth(new Date());
            const end = endOfMonth(new Date());

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
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0);

    return {
        expenses,
        totalSpent,
        spentToday,
        salary,
        totalIncome,
        loading,
        remainingBalance: salary + totalIncome - totalSpent,
        refreshExpenses: loadData
    };
};
