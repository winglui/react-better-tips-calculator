import {
  Button,
  IconButton,
  InputAdornment,
  Slider,
  TextField,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ArrowCircleUpIcon from "@mui/icons-material/ArrowCircleUp";
import ArrowCircleDownIcon from "@mui/icons-material/ArrowCircleDown";
import RemoveIcon from "@mui/icons-material/Remove";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { useState } from "react";

// Only user inputs live in state; the tip amount and total are derived from them on each render.
const INITIAL_VALUE = {
  billAmount: 0,
  tipPercent: 18,
  people: 1,
};

const MAX_PEOPLE = 20;

// Round, comfortably tappable (44px) buttons for the People stepper.
const stepperButtonSx = { width: 44, height: 44, border: 1, borderColor: "divider" };

// Keep the current tip % when there's no bill to derive it from (avoids NaN/Infinity).
function tipPercentFor(tipAmount: number, billAmount: number, fallback: number) {
  return billAmount > 0 ? (tipAmount / billAmount) * 100 : fallback;
}

// Snap to cents so float noise (e.g. 50 * 1.18 = 59.00000000000001) still counts as a whole number.
function toCents(amount: number) {
  return Math.round(amount * 100) / 100;
}

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
function formatMoney(amount: number) {
  return currency.format(amount);
}

// Money can't be negative: pasted or scrolled values below zero become 0.
function nonNegative(value: string) {
  return Math.max(0, +value);
}

// Stop "-" from being typed into the money fields.
function blockMinus(e: React.KeyboardEvent) {
  if (e.key === "-") e.preventDefault();
}

// "$" shown in front of the money input fields; the input value itself stays a plain number.
const moneySlotProps = {
  input: { startAdornment: <InputAdornment position="start">$</InputAdornment> },
};

// Split a total into shares that add up exactly: `extra` people pay 1¢ more than `base`.
function splitBill(total: number, people: number) {
  const cents = Math.round(total * 100);
  const base = Math.floor(cents / people);
  return { base: base / 100, extra: cents % people };
}

function describeShares(total: number, people: number) {
  const { base, extra } = splitBill(total, people);
  if (extra === 0) return formatMoney(base);
  const group = (count: number, amount: number) =>
    `${count} ${count === 1 ? "pays" : "pay"} ${formatMoney(amount)}`;
  return `${group(extra, base + 0.01)}, ${group(people - extra, base)}`;
}

const Main = () => {
  const [billValue, setBillValue] = useState(() => INITIAL_VALUE);
  // Raw text of the tip field while it's being edited (null = not editing, show the formatted tip).
  const [tipText, setTipText] = useState<string | null>(null);

  // The tip is kept to whole cents, so the total and the split shares add up exactly.
  const tipAmount = toCents(billValue.billAmount * (billValue.tipPercent / 100));
  const totalAmount = toCents(billValue.billAmount + tipAmount);

  function handleBillAmountChanged(e: React.ChangeEvent<HTMLInputElement>) {
    setBillValue((prev) => ({ ...prev, billAmount: nonNegative(e.target.value) }));
  }

  function handleTipPercentChanged(_: Event, newValue: number) {
    setBillValue((prev) => ({ ...prev, tipPercent: newValue }));
  }

  // Typing a tip amount (or rounding) sets the tip % that produces it.
  function setTipAmount(newTipAmount: number) {
    setBillValue((prev) => ({
      ...prev,
      tipPercent: tipPercentFor(newTipAmount, prev.billAmount, prev.tipPercent),
    }));
  }

  function handleTipAmountChanged(e: React.ChangeEvent<HTMLInputElement>) {
    const value = nonNegative(e.target.value);
    setTipText(value === +e.target.value ? e.target.value : String(value));
    setTipAmount(value);
  }

  function changePeople(delta: number) {
    setBillValue((prev) => ({
      ...prev,
      people: Math.min(MAX_PEOPLE, Math.max(1, prev.people + delta)),
    }));
  }

  // Round to the nearest whole dollar; if the total is already whole, step $1 instead.
  function roundDown() {
    const newTotalAmount = Number.isInteger(totalAmount)
      ? totalAmount - 1
      : Math.floor(totalAmount);
    // Never round below the bill (that would make the tip negative).
    if (newTotalAmount >= billValue.billAmount) {
      round(newTotalAmount);
    }
  }

  function roundUp() {
    round(Number.isInteger(totalAmount) ? totalAmount + 1 : Math.ceil(totalAmount));
  }

  function round(newTotalAmount: number) {
    setTipAmount(toCents(newTotalAmount - billValue.billAmount));
  }

  function handleOnBillAmountFocus(event: React.FocusEvent<HTMLInputElement>) {
    event?.target?.select();
  }

  function handleOnTipAmountFocus(event: React.FocusEvent<HTMLInputElement>) {
    setTipText(tipAmount.toFixed(2));
    event.target.select();
  }

  function reset() {
    setBillValue(INITIAL_VALUE);
  }

  return (
    <main className="m-5 flex flex-col gap-5">
      <p>
        Simply enter the bill amount and the calculator will compute the tip and
        total amount.
      </p>
      <TextField
        id="billAmount"
        autoFocus
        aria-label="Bill Amount"
        label="Bill Amount"
        variant="standard"
        type="number"
        value={billValue.billAmount}
        slotProps={moneySlotProps}
        onFocus={handleOnBillAmountFocus}
        onKeyDown={blockMinus}
        onChange={handleBillAmountChanged}
      />

      <p className="label">Tip % ({billValue.tipPercent.toFixed(2)}%)</p>
      <Slider
        className="!p-0"
        aria-label="Tip Percent"
        id="tipPercent"
        value={billValue.tipPercent}
        min={0}
        max={100}
        step={1}
        shiftStep={5}
        valueLabelDisplay="auto"
        onChange={handleTipPercentChanged}
      />
      <TextField
        id="tipAmount"
        name="tipAmount"
        type="number"
        aria-label="Tip Amount"
        label="Tip Amount"
        variant="standard"
        value={tipText ?? tipAmount.toFixed(2)}
        slotProps={moneySlotProps}
        onFocus={handleOnTipAmountFocus}
        onKeyDown={blockMinus}
        onBlur={() => setTipText(null)}
        onChange={handleTipAmountChanged}
      />
      <div>
        <p className="label">Total Amount</p>
        <p>{formatMoney(totalAmount)}</p>
      </div>

      {billValue.billAmount > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outlined"
            aria-label="Round down"
            onClick={roundDown}
            startIcon={<ArrowCircleDownIcon />}
          >
            Round down
          </Button>
          <Button
            variant="outlined"
            aria-label="Round up"
            onClick={roundUp}
            startIcon={<ArrowCircleUpIcon />}
          >
            Round up
          </Button>
        </div>
      )}

      {/* Always visible, so it's clear from the start that the app can split the bill. */}
      <div className="flex items-center justify-between">
        <p id="people-label">People</p>
        <div role="group" aria-labelledby="people-label" className="flex items-center gap-3">
          <IconButton
            aria-label="Remove a person"
            disabled={billValue.people <= 1}
            onClick={() => changePeople(-1)}
            sx={stepperButtonSx}
          >
            <RemoveIcon />
          </IconButton>
          <span
            id="people"
            aria-live="polite"
            className="w-6 text-center text-xl tabular-nums"
          >
            {billValue.people}
          </span>
          <IconButton
            aria-label="Add a person"
            disabled={billValue.people >= MAX_PEOPLE}
            onClick={() => changePeople(1)}
            sx={stepperButtonSx}
          >
            <AddIcon />
          </IconButton>
        </div>
      </div>

      {billValue.billAmount > 0 && billValue.people > 1 && (
        <div>
          <p className="label">
            {splitBill(totalAmount, billValue.people).extra === 0
              ? "Each Pays"
              : "Shares"}
          </p>
          <p>{describeShares(totalAmount, billValue.people)}</p>
        </div>
      )}

      {billValue.billAmount > 0 && (
        <div className="flex justify-end">
          {/* The negative margin offsets the text button's padding so "Reset" lines up with the right edge. */}
          <Button aria-label="Reset" onClick={reset} startIcon={<RestartAltIcon />} sx={{ mr: -1 }}>
            Reset
          </Button>
        </div>
      )}
    </main>
  );
};

export default Main;
