import { DatePicker, Radio } from "antd";
import { useIntl } from "@umijs/max";
import moment from "moment";
import { useState } from "react";
import type { RangePickerValue } from "@/types/common";
import type { RadioChangeEvent } from "antd/lib/radio/interface";
import { DaysTrendsType } from "@/types/common";

const defaultDateTypes = [
  DaysTrendsType.DAY7,
  DaysTrendsType.DAY30,
  DaysTrendsType.DAYNOW,
];

export default function DateSelector({
  onDateChange,
  dateTypes = defaultDateTypes,
  defaultType = DaysTrendsType.DAY7,
}: {
  onDateChange: (type: DaysTrendsType, date: RangePickerValue) => void;
  dateTypes?: DaysTrendsType[];
  defaultType?: DaysTrendsType;
}) {
  const intl = useIntl();
  const { formatMessage } = intl;
  const [dateSelectedCase, setDateSelectedCase] = useState(defaultType);
  const [dateRange, setDateRange] = useState<RangePickerValue>([]);

  const handleDateChange = (val: RangePickerValue) => {
    const newDateType = val ? DaysTrendsType.DATERANGE : dateTypes[0];
    setDateRange(val);
    setDateSelectedCase(newDateType);
    onDateChange(newDateType, val);
  };

  const handleRadioChange = (e: RadioChangeEvent) => {
    setDateSelectedCase(e.target.value);
    setDateRange([]);
    onDateChange(e.target.value, []);
  };

  return (
    <>
      <Radio.Group
        value={dateSelectedCase}
        size="small"
        onChange={handleRadioChange}
      >
        {dateTypes.map((item) => (
          <Radio.Button key={item} value={item}>
            {formatMessage({ id: `common.date.filter.${item}` })}
          </Radio.Button>
        ))}
      </Radio.Group>
      <DatePicker.RangePicker
        value={dateRange}
        onChange={handleDateChange}
        style={{ width: 240 }}
        className="margin-left-5"
        disabledDate={(current: moment.Moment) =>
          current && current > moment().endOf("day")
        }
      />
    </>
  );
}
