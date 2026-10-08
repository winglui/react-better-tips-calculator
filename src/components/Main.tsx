import {
  Button,
  IconButton,
  InputAdornment,
  Slider,
  TextField,
} from "@mui/material";
import ArrowCircleUpIcon from "@mui/icons-material/ArrowCircleUp";
import ArrowCircleDownIcon from "@mui/icons-material/ArrowCircleDown";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import GroupAddOutlinedIcon from "@mui/icons-material/GroupAddOutlined";
import { useState } from "react";

const INITIAL_VALUE = {
  billAmount: 0,
  tipPercent: 18,
  tipAmount: 0,
  totalAmount: 0,
  showGroup: false,
  split: 1,
};

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

  function handleBillAmountChanged(e: React.ChangeEvent<HTMLInputElement>) {
    const value = +e.target.value;

    setBillValue((prev) => ({
      ...prev,
      billAmount: value,
      tipAmount: value * (prev.tipPercent / 100),
      totalAmount: value + value * (prev.tipPercent / 100),
    }));
  }

  function handleTipPercentChanged(_: Event, newValue: number) {
    const newTipAmount = billValue.billAmount * (newValue / 100);
    setBillValue((prev) => ({
      ...prev,
      tipPercent: newValue,
      tipAmount: newTipAmount,
      totalAmount: billValue.billAmount + newTipAmount,
    }));
  }

  function handleTipAmountChanged(e: React.ChangeEvent<HTMLInputElement>) {
    setTipText(e.target.value);
    const newTipAmountValue = +e.target.value;

    setBillValue((prev) => ({
      ...prev,
      tipPercent: tipPercentFor(
        newTipAmountValue,
        prev.billAmount,
        prev.tipPercent
      ),
      tipAmount: newTipAmountValue,
      totalAmount: prev.billAmount + newTipAmountValue,
    }));
  }

  function handleSplitChanged(_: Event, newValue: number) {
    setBillValue((prev) => ({
      ...prev,
      split: newValue,
    }));
  }

  // Round to the nearest whole dollar; if the total is already whole, step $1 instead.
  function roundDown() {
    const total = toCents(billValue.totalAmount);
    const newTotalAmount = Number.isInteger(total) ? total - 1 : Math.floor(total);
    // Never round below the bill (that would make the tip negative).
    if (newTotalAmount >= billValue.billAmount) {
      round(newTotalAmount);
    }
  }

  function roundUp() {
    const total = toCents(billValue.totalAmount);
    round(Number.isInteger(total) ? total + 1 : Math.ceil(total));
  }

  function round(newTotalAmount: number) {
    const newTipAmount = toCents(newTotalAmount - billValue.billAmount);
    setBillValue((prev) => ({
      ...prev,
      tipPercent: tipPercentFor(newTipAmount, prev.billAmount, prev.tipPercent),
      tipAmount: newTipAmount,
      totalAmount: newTotalAmount,
    }));
  }

  function handleOnBillAmountFocus(event: React.FocusEvent<HTMLInputElement>) {
    event?.target?.select();
  }

  function handleOnTipAmountFocus(event: React.FocusEvent<HTMLInputElement>) {
    setTipText(billValue.tipAmount.toFixed(2));
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
        value={tipText ?? billValue.tipAmount.toFixed(2)}
        slotProps={moneySlotProps}
        onFocus={handleOnTipAmountFocus}
        onBlur={() => setTipText(null)}
        onChange={handleTipAmountChanged}
      />
      <div>
        <p className="label">Total Amount</p>
        <p>{formatMoney(billValue.totalAmount)}</p>
      </div>

      {billValue.billAmount > 0 && (
        <div className="flex flex-wrap mt-5 gap-3">
          <Button
            className=""
            variant="outlined"
            size="small"
            aria-label="Round Down"
            onClick={roundDown}
            startIcon={<ArrowCircleDownIcon />}
          >
            Round Down
          </Button>
          <Button
            className=""
            variant="outlined"
            aria-label="Round Up"
            size="small"
            onClick={roundUp}
            startIcon={<ArrowCircleUpIcon />}
          >
            Round Up
          </Button>
          <IconButton
            aria-label="Add person to split the bill"
            color="secondary"
            onClick={() =>
              setBillValue((prev) => ({ ...prev, showGroup: !prev.showGroup }))
            }
          >
            <GroupAddOutlinedIcon />
          </IconButton>
          <IconButton aria-label="Reset" color="primary" onClick={reset}>
            <RestartAltIcon />
          </IconButton>
        </div>
      )}

      {billValue.showGroup && (
        <>
          <p className="label">Split: {billValue.split}</p>
          <Slider
            className="!p-0"
            aria-label="Split"
            id="split"
            value={billValue.split}
            min={1}
            max={20}
            step={1}
            shiftStep={5}
            valueLabelDisplay="auto"
            onChange={handleSplitChanged}
          />
          <div>
            <p className="label">
              {splitBill(billValue.totalAmount, billValue.split).extra === 0
                ? "Each Pays"
                : "Shares"}
            </p>
            <p>{describeShares(billValue.totalAmount, billValue.split)}</p>
          </div>
        </>
      )}
    </main>
  );
};

export default Main;
