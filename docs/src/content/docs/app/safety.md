---
title: Safety Cross
description: Daily safety tracking with calendar visualization and accident counters.
---

The Safety Cross page provides a visual, calendar-based view of daily safety status across shifts. It tracks safe days, near-misses, and incidents.

## Safety Statistics

```
┌─────────────────────────────────────────────────────────┐
│  Management Tools › Safety Cross                        │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─ Safety Statistics ──────────────────────────────┐   │
│  │                                                  │   │
│  │  Days Without    Total     Safe    Near-Miss     │   │
│  │  Accident        Entries                         │   │
│  │  ┌───────┐      ┌────┐   ┌────┐   ┌────┐        │   │
│  │  │  42   │      │ 58 │   │ 51 │   │  5 │        │   │
│  │  │(green)│      └────┘   │grn │   │ylw │        │   │
│  │  └───────┘               └────┘   └────┘        │   │
│  │                                                  │   │
│  │  Incident       Not Reported                     │   │
│  │  ┌────┐         ┌────┐                           │   │
│  │  │  1 │         │  1 │                           │   │
│  │  │red │         │gray│                           │   │
│  │  └────┘         └────┘                           │   │
│  │                                                  │   │
│  └──────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Safety Cross Calendar

The main feature is a full-month calendar where each day is color-coded by safety status. Click any day to record or update the safety status.

```
┌─ Safety Cross Calendar ─────────────────────────────────┐
│                                                         │
│  [< Prev]      February 2026        [Today]  [Next >]  │
│                                                         │
│  ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┐           │
│  │ Mon │ Tue │ Wed │ Thu │ Fri │ Sat │ Sun │           │
│  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤           │
│  │     │     │     │     │     │     │  1  │           │
│  │     │     │     │     │     │     │░░░░░│           │
│  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤           │
│  │  2  │  3  │  4  │  5  │  6  │  7  │  8  │           │
│  │▓▓▓▓▓│▓▓▓▓▓│▓▓▓▓▓│▓▓▓▓▓│▓▓▓▓▓│░░░░░│░░░░░│           │
│  │Safe │Safe │Safe │Safe │Safe │     │     │           │
│  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤           │
│  │  9  │ 10  │ 11  │ 12  │ 13  │ 14  │ 15  │           │
│  │▓▓▓▓▓│▓▓▓▓▓│▓▓▓▓▓│▓▓▓▓▓│▓▓▓▓▓│░░░░░│░░░░░│           │
│  │Safe │Safe │Near │Safe │Safe │     │     │           │
│  │     │     │Miss │     │     │     │     │           │
│  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤           │
│  │ 16  │ 17  │ 18  │ 19  │ 20  │ 21  │ 22  │           │
│  │▓▓▓▓▓│▓▓▓▓▓│▓▓▓▓▓│▓▓▓▓▓│▓▓▓▓▓│░░░░░│░░░░░│           │
│  │Safe │Safe │Safe │Safe │Incd │     │     │           │
│  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┤           │
│  │ 23  │ 24  │ 25  │ 26  │ 27  │ 28  │     │           │
│  │▓▓▓▓▓│▓▓▓▓▓│     │     │     │     │     │           │
│  │Safe │Safe │     │     │     │     │     │           │
│  └─────┴─────┴─────┴─────┴─────┴─────┴─────┘           │
│                                                         │
│  Legend: ▓ Safe (green)  Near-Miss (yellow)              │
│          Incident (red)  ░ Not Reported (gray)           │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Mark Safety Status Modal

Clicking a day opens a form to record the safety status for that shift.

```
┌─ Mark Safety Status ────────────────────────── [X] ─────┐
│                                                         │
│  Date                                                   │
│  ┌───────────────────────────────────────────────────┐  │
│  │ 2026-02-25                                        │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Shift *                       Team                     │
│  ┌──────────────────┐          ┌──────────────────┐     │
│  │ Morning (06-14) ▾│          │ Alpha          ▾ │     │
│  └──────────────────┘          └──────────────────┘     │
│                                                         │
│  Safety Status *                                        │
│  ┌──────┐ ┌───────────┐ ┌──────────┐ ┌──────────────┐  │
│  │ Safe │ │ Near-Miss │ │ Incident │ │ Not Reported │  │
│  └──────┘ └───────────┘ └──────────┘ └──────────────┘  │
│                                                         │
│  Notes                                                  │
│  ┌───────────────────────────────────────────────────┐  │
│  │ All PPE checks passed. No incidents during shift. │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│                                [Cancel]  [Save]         │
└─────────────────────────────────────────────────────────┘
```

## Recent Safety Entries

A table below the calendar shows the latest 20 entries.

```
┌─ Recent Safety Entries ─────────────────────────────────┐
│                                                         │
│  ┌────────────┬──────────┬───────────┬───────┬────────┐ │
│  │ Date       │ Shift    │ Status    │ Team  │ Notes  │ │
│  ├────────────┼──────────┼───────────┼───────┼────────┤ │
│  │ 2026-02-24 │ Morning  │ Safe      │ Alpha │        │ │
│  │ 2026-02-24 │ Afternoon│ Safe      │ Beta  │        │ │
│  │ 2026-02-23 │ Morning  │ Safe      │ Alpha │        │ │
│  │ 2026-02-20 │ Morning  │ Incident  │ Gamma │ Slip   │ │
│  │ 2026-02-19 │ Afternoon│ Safe      │ Beta  │        │ │
│  └────────────┴──────────┴───────────┴───────┴────────┘ │
│                                                         │
└─────────────────────────────────────────────────────────┘
```
