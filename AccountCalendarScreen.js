import React, { useState } from 'react';
import {View, StyleSheet} from 'react-native';
import { CalendarList } from 'react-native-calendars';
import moment from 'moment';
import { Formik } from 'formik';
import {useDispatch, useSelector} from "react-redux";
import {filterByDate, resetDateFilter, setPeriod} from "../../redux/modals/filtersSlice";
import Button from "../../components/AddButton/AddButton";
import {styles} from "../../styles/styles";

export default function AccountCalendarScreen({navigation}) {
  const filters = useSelector(store => store.filters);
  const dispatch = useDispatch();
  const today = moment().format('YYYY-MM-DD');
  const endOfMonth = moment().endOf('month').format('YYYY-MM-DD');

  const disabledDates = {};
  for (let date = moment(today).add(1, 'day'); date.isBefore(endOfMonth) || date.isSame(endOfMonth); date.add(1, 'day')) {
    disabledDates[date.format('YYYY-MM-DD')] = { disabled: true };
  }

  const handleSubmitForm = (values) => {
    const periodDates = Object.keys(values.selectedDates).sort((a, b) => new Date(a) - new Date(b));
    // console.log(periodDates);
    dispatch(setPeriod(periodDates));
    dispatch(filterByDate("period"));
    navigation.navigate("AccountsScreen");
  };

  return (
    <View style={style.container}>
      <Formik
        initialValues={{ selectedDates: {} }}
        onSubmit={handleSubmitForm}
      >
        {({ values, setFieldValue, handleSubmit }) => {
          const onDayPress = (day) => {
            if (day.dateString > today) {
              return;
            }

            let selected = { ...values.selectedDates };

            // Toggle selection
            if (selected[day.dateString]) {
              delete selected[day.dateString];
            } else {
              selected[day.dateString] = { selected: true, marked: true, selectedColor: '#00DD3E' };
            }

            setFieldValue('selectedDates', selected);
          };

          return (<View style={[styles.mb20, styles.pb20]}>
            <CalendarList
              futureScrollRange={0}
              pastScrollRange={60}
              onDayPress={onDayPress}
              markedDates={{ ...values.selectedDates, ...disabledDates }}
              markingType={'period'}
              maxDate={endOfMonth}
              theme={{
                selectedDayBackgroundColor: '#00DD3E',
                selectedDayTextColor: '#000',
                todayTextColor: '#00DD3E',
                dayTextColor: '#2d4150',
                textDisabledColor: '#d9e1e8',
                dotColor: '#00DD3E',
                selectedDotColor: '#ffffff',
                monthTextColor: 'black',
                indicatorColor: 'blue',
                textDayFontFamily: 'monospace',
                textMonthFontFamily: 'monospace',
                textDayHeaderFontFamily: 'monospace',
                textDayFontWeight: '300',
                textMonthFontWeight: 'bold',
                textDayHeaderFontWeight: '300',
                textDayFontSize: 16,
                textMonthFontSize: 16,
                textDayHeaderFontSize: 16,
              }}
            />
            <View style={style.buttonContainer}>
              <Button title="Сбросить" style={style.button} callback={() => {setFieldValue('selectedDates', {}); dispatch(resetDateFilter())}} />
              <Button title="Применить" style={style.button} callback={handleSubmit} />
            </View>
          </View>);
        }}
      </Formik>
    </View>
  );
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  buttonContainer: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  button: {
    width: '40%',
  },
});
