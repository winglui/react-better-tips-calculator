import { Button, Slider, TextField } from "@mui/material";
import ArrowCircleUpIcon from "@mui/icons-material/ArrowCircleUp";
import ArrowCircleDownIcon from "@mui/icons-material/ArrowCircleDown";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import GroupAddIcon from "@mui/icons-material/GroupAdd";
import { useState } from "react";

const INITIAL_VALUE = {
  billAmount: 0,
  tipPercent: 18,
  tipAmount: 0,
  totalAmount: 0,
  showGroup: false,
  split: 1,
};

const Main = () => {
  const [billValue, setBillValue] = useState(() => INITIAL_VALUE);

  console.log(billValue);

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
    const newTipAmountValue = +e.target.value;

    setBillValue((prev) => ({
      ...prev,
      tipPercent: (newTipAmountValue / prev.billAmount) * 100,
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

  function roundDown() {
    const newTotalAmount = Math.floor(billValue.totalAmount);
    round(newTotalAmount);
  }

  function roundUp() {
    const newTotalAmount = Math.ceil(billValue.totalAmount);
    round(newTotalAmount);
  }

  function round(newTotalAmount: number) {
    const newTipAmount =
      billValue.tipAmount - (billValue.totalAmount - newTotalAmount);
    setBillValue((prev) => ({
      ...prev,
      tipPercent: (newTipAmount / prev.billAmount) * 100,
      tipAmount: newTipAmount,
      totalAmount: newTotalAmount,
    }));
  }

  function handleOnBillAmountFocus(event: React.FocusEvent<HTMLInputElement>) {
    event?.target?.select();
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
        aria-label="Bill Amount"
        label="Bill Amount"
        variant="standard"
        type="number"
        value={billValue.billAmount}
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
        value={billValue.tipAmount.toFixed(2)}
        onChange={handleTipAmountChanged}
      />
      <div>
        <p className="label">Total Amount</p>
        <p>{billValue.totalAmount.toFixed(2)}</p>
      </div>

      {billValue.billAmount > 0 && (
        <div className="flex flex-wrap mt-5 gap-3">
          <Button className="" variant="contained" onClick={roundDown}>
            <ArrowCircleUpIcon /> Round Down
          </Button>
          <Button className="" variant="contained" onClick={roundUp}>
            <ArrowCircleDownIcon /> Round Up
          </Button>
          <Button
            className=""
            variant="text"
            onClick={() =>
              setBillValue((prev) => ({ ...prev, showGroup: !prev.showGroup }))
            }
          >
            <GroupAddIcon />
          </Button>
          <Button className="" variant="text" onClick={reset}>
            <RestartAltIcon />
          </Button>
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
            min={0}
            max={20}
            step={1}
            shiftStep={5}
            valueLabelDisplay="auto"
            onChange={handleSplitChanged}
          />
          <div>
            <p className="label">Each Pays</p>
            <p>{(billValue.totalAmount / billValue.split).toFixed(2)}</p>
          </div>
        </>
      )}
    </main>
  );
};

export default Main;
