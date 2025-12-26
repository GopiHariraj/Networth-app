"use client";

import React, { useState } from 'react';

export default function Calculator() {
    const [isOpen, setIsOpen] = useState(false);
    const [display, setDisplay] = useState('0');
    const [previousValue, setPreviousValue] = useState<string>('');
    const [operation, setOperation] = useState<string>('');

    const handleNumber = (num: string) => {
        if (display === '0') {
            setDisplay(num);
        } else {
            setDisplay(display + num);
        }
    };

    const handleOperation = (op: string) => {
        setPreviousValue(display);
        setOperation(op);
        setDisplay('0');
    };

    const calculate = () => {
        const prev = parseFloat(previousValue);
        const current = parseFloat(display);
        let result = 0;

        switch (operation) {
            case '+':
                result = prev + current;
                break;
            case '-':
                result = prev - current;
                break;
            case '×':
                result = prev * current;
                break;
            case '÷':
                result = prev / current;
                break;
            default:
                return;
        }

        setDisplay(result.toString());
        setPreviousValue('');
        setOperation('');
    };

    const clear = () => {
        setDisplay('0');
        setPreviousValue('');
        setOperation('');
    };

    const handleBackspace = () => {
        if (display.length > 1) {
            setDisplay(display.slice(0, -1));
        } else {
            setDisplay('0');
        }
    };

    const handleDecimal = () => {
        if (!display.includes('.')) {
            setDisplay(display + '.');
        }
    };

    const buttons = [
        ['7', '8', '9', '÷'],
        ['4', '5', '6', '×'],
        ['1', '2', '3', '-'],
        ['⌫', '0', '.', '+'],
        ['C'],
    ];

    return (
        <>
            {/* Calculator Widget */}
            {isOpen && (
                <div className="fixed bottom-24 right-6 z-50 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 w-80 animate-in slide-in-from-bottom-4 fade-in duration-200">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-slate-900 dark:text-white">🧮 Calculator</h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                        >
                            ✕
                        </button>
                    </div>

                    {/* Display */}
                    <div className="bg-slate-100 dark:bg-slate-900 rounded-xl p-4 mb-4 text-right">
                        <div className="text-xs text-slate-500 min-h-4">
                            {previousValue && `${previousValue} ${operation}`}
                        </div>
                        <div className="text-2xl font-bold text-slate-900 dark:text-white truncate">
                            {display}
                        </div>
                    </div>

                    {/* Buttons */}
                    <div className="grid grid-cols-4 gap-2">
                        {buttons.map((row, i) => (
                            <React.Fragment key={i}>
                                {row.map((btn) => {
                                    const isOperation = ['÷', '×', '-', '+'].includes(btn);
                                    const isClear = btn === 'C';
                                    const isEquals = btn === '=';

                                    return (
                                        <button
                                            key={btn}
                                            onClick={() => {
                                                if (btn === 'C') clear();
                                                else if (btn === '⌫') handleBackspace();
                                                else if (btn === '.') handleDecimal();
                                                else if (isOperation) handleOperation(btn);
                                                else handleNumber(btn);
                                            }}
                                            className={`py-3 px-4 rounded-xl font-semibold transition-all ${isClear
                                                ? 'bg-red-500 hover:bg-red-600 text-white'
                                                : isOperation
                                                    ? 'bg-blue-500 hover:bg-blue-600 text-white'
                                                    : 'bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white'
                                                }`}
                                        >
                                            {btn}
                                        </button>
                                    );
                                })}
                            </React.Fragment>
                        ))}
                        <button
                            onClick={calculate}
                            className="col-span-4 py-3 px-4 rounded-xl font-semibold bg-green-500 hover:bg-green-600 text-white transition-all"
                        >
                            = Calculate
                        </button>
                    </div>
                </div>
            )}

            {/* Floating Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center text-2xl transition-all hover:scale-110 active:scale-95"
                title="Calculator"
            >
                🧮
            </button>
        </>
    );
}
