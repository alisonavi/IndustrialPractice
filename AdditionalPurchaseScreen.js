import { useCallback, useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDispatch, useSelector } from "react-redux";
import dayjs from "dayjs";
import { styles } from '../../styles/styles';
import { addExpense, createDefaultRequest, resetExpenses, setExpenses } from "../../redux/requests/requestsSlice";
import { showToaster } from "../../redux/modals/modalsSlice";
import { sendNotification } from "../../redux/notifications/notificationsSlice";
import { PENDING } from "../../constants/constants";
import {fetchAccountNumbers, fetchLastAccountNumber, pushAccount} from "../../redux/accounts/accountsSlice";
import { fetchPermissions, resetEmployee } from "../../redux/employees/employeeSlice";
import { ScrollView, StatusBar, TextInput, TouchableOpacity, View, Text } from "react-native";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { Formik } from "formik";
import { createPurchaseValidation } from "../../constants/Validations";
import { Dropdown } from "react-native-element-dropdown";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { formatDate } from "../../helpers/FormatDate";
import { Plus } from "../../constants/icons/LoginLogo";
import Loader from "../../components/loader/Loader";
import { useFocusEffect } from "@react-navigation/native";
import Button from "../../components/AddButton/AddButton";
import * as React from "react";
import { formatMoney, formatMoneyInput } from "../../helpers/FormatMoney";

export default function AdditionalPurchaseScreen({ navigation, route }) {
  const { account } = route.params;
  console.log("account", account);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [additionalAccountNumber, setAdditionalAccountNumber] = useState(null);
  const [expensesError, setExpensesError] = useState("");
  const dispatch = useDispatch();
  const requests = useSelector(store => store.requests);
  const user = useSelector(store => store.user);
  const employee = useSelector(store => store.employee);
  const accounts = useSelector(store => store.accounts);

  let newNumber;

  const generateNewAccountNumber = (base, accountsList) => {
    console.log("Base input:", base);
    console.log("Accounts list input:", accountsList);

    // Если base может быть типа "5/1", то возьмём только то, что до первого слэша — "5"
    const [pureBase] = base.split("/");
    console.log("Pure base:", pureBase);

    // Далее вся логика работает именно с pureBase
    const filteredNumbers = accountsList
      .map(acc => acc.transaction_number?.toString().trim())
      .filter(Boolean)
      .filter(accountNumber => {
        const [mainPart] = accountNumber.split("/");
        return mainPart === pureBase;
      });
    console.log("Filtered numbers:", filteredNumbers);

    const extraNumbers = filteredNumbers.map(accountNumber => {
      const [, extraPart] = accountNumber.split("/");
      return extraPart ? parseInt(extraPart, 10) : 0;
    });
    console.log("Extra numbers:", extraNumbers);

    const maxExtra = extraNumbers.length ? Math.max(...extraNumbers) : 0;
    console.log("Max extra number:", maxExtra);

    newNumber = maxExtra + 1;
    const newAccount = `${pureBase}/${newNumber}`;
    console.log("Generated new account number:", newAccount);

    setAdditionalAccountNumber(newAccount);
  };

  const handleSendRequest = (values) => {
    console.log("values.expenses", values.expenses);
    for (let i = 0; i < values.expenses.length; i++) {
      const expense = values.expenses[i];
      if ((expense.name && !expense.amount) || (!expense.name && expense.amount)) {
        return setExpensesError("Заполните все необходимые поля для каждого расхода");
      }
    }

    if (values.expenses.length === 0) {
      return setExpensesError("В списках расходов должна быть хотя бы Транспортировка");
    } else if (values.expenses[0].name !== "Транспортировка") {
      return setExpensesError("Первым должен быть расход на Транспортировку");
    } else if (values.expenses[0].amount === "" || values.expenses[0].amount === "0") {
      return setExpensesError("Укажите сумму расхода на Транспортировку");
    }
    const updatedExpenses = values.expenses.map(expense => ({
      ...expense,
      amount: parseFloat(expense.amount || 0)
    }));

    const parsedAmount = parseFloat(values.amount.replace(/\s/g, '') || 0);
    const parsedSellingPrice = parseFloat(values.selling_price.replace(/\s/g, '') || 0);

    let transformedData = "";
    if (values.date) {
      const hour = dayjs().hour();
      const min = dayjs().minute();
      const second = dayjs().second();
      transformedData = `${values.date[6] + values.date[7] + values.date[8] + values.date[9] + '-' + values.date[3] + values.date[4] + '-' + values.date[0] + values.date[1]} ${hour}:${min}:${second}`;
    }

    const payload = {
      tender_number: values.tender_number,
      product_name: values.product_name,
      sell: parsedSellingPrice,
      type: "Закуп",
      user_id: user.id,
      company_id: values.company_id,
      organization: values.organization,
      amount: parsedAmount,
      total: parsedAmount + updatedExpenses.reduce((acc, expense) => acc + expense.amount, 0),
      expenses: updatedExpenses,
      date: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      status: PENDING,
      ...(values.account_number && { transaction_number: values.account_number }),
      ...(transformedData && { completed_date: transformedData })
    };

    console.log("payload", payload);

    dispatch(createDefaultRequest(payload))
      .unwrap()
      .then((result) => {
        if (result) {
          console.log("\n\nAccount:", result);
          dispatch(pushAccount(result));
          dispatch(showToaster({ type: "success", message: "Счет успешно отправлен на рассмотрение!" }));
          dispatch(sendNotification({
            user_id: 1,
            title: "Tender Community",
            body: `${user.name} ${user.last_name} отправил вам запрос на закуп!`,
            sender: user.id,
            receiver: 1,
            link: "AccountScreen",
            param1: `${result.id}`
          }))
          navigation.goBack();
        }
      })
      .catch((err) => {
        // Обработка ошибки здесь
        dispatch(showToaster({ type: "error", message: "Не удалось отправить счет на рассмотрение..." }));
        navigation.goBack();
        console.error('Failed to update user', err);
      });
  };

  const handleAddExpense = (setFieldValue, values) => {
    console.log("accounts.expenses", accounts.expenses);
    // dispatch(addExpense({ name: "", amount: "" }));
    const updatedExpenses = [...values.expenses, { name: "", amount: "" }];
    console.log("updatedExpenses", updatedExpenses);
    setFieldValue("expenses", updatedExpenses);
  }

  const switchDatePicker = () => {
    setDatePickerVisibility(!isDatePickerVisible);
  }

  useFocusEffect(
    useCallback(() => {
      employee.permissions && employee.permissions.length === 0 && dispatch(fetchPermissions(user.id));
      dispatch(fetchLastAccountNumber());
      dispatch(fetchAccountNumbers());
      dispatch(setExpenses(account.expenses && account.expenses));
      return () => {
        dispatch(resetExpenses());
      };
    }, [employee.permissions, user.id, account.expenses])
  );

  useEffect(() => {
    if (accounts?.numberAccounts?.length) generateNewAccountNumber(account.transaction_number, accounts.numberAccounts);
  }, [accounts.numberAccounts]);

  // if(!additionalAccountNumber) return <Loader />
  return (
    <SafeAreaView edges={['left', 'right', 'top']} style={{ flex: 1, backgroundColor: "#ffffff" }}>
      {/* <StatusBar barStyle="light-content" backgroundColor={"#f1f1f1"}/> */}
      <View style={[styles.pb40, styles.reportsHeader, {
        backgroundColor: "#f1f1f1",
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
        justifyContent: "none"
      }]}>
        <TouchableOpacity style={[styles.secondaryHeader, { justifyContent: "center" }]}
          onPress={() => navigation.goBack()}>
          <FontAwesomeIcon icon={faArrowLeft} size={20} style={[styles.ph15, styles.pl35, { color: "#000", }]} />
        </TouchableOpacity>
        <Text style={[styles.secondaryHeader, styles.fs20]}>Запрос на закуп на товар</Text>
      </View>
      <ScrollView>
        {
          additionalAccountNumber
            ? (
              <Formik initialValues={{
                account_number: additionalAccountNumber,
                date: "",
                amount: "",
                tender_number: "",
                selling_price: "",
                organization: account.organization,
                product_name: account.product_name,
                expenses: requests.expenses,
                company_id: account.company_id
              }} onSubmit={handleSendRequest}
                validationSchema={createPurchaseValidation}>
                {({ setFieldValue, handleChange, handleBlur, handleSubmit, values, errors, touched, }) => (
                  <View style={[styles.ph15, styles.pt10]}>
                    <Text style={[styles.label, styles.pl15, styles.pb5, { color: "#000" }]}>
                      Фирма
                    </Text>
                    <Dropdown selectedTextStyle={{ color: "#000", opacity: 0.4 }} containerStyle={{ borderRadius: 10 }}
                      placeholderStyle={{ color: "#9A9A9A" }}
                      style={[styles.ph5, styles.pv10, styles.mb10, {
                        backgroundColor: "#F1F1F1",
                        borderRadius: 10
                      }]}
                      placeholder={"Выберите фирму"}
                      value={values.company_id}
                      data={employee.permissions}
                      labelField={"companyname"}
                      valueField={"company_id"}
                      onChange={(item) => {
                        setFieldValue('company_id', item.company_id)
                      }}
                      disable={true}
                      iconStyle={{ display: "none" }}
                    />
                    {touched.company_id && errors.company_id && (
                      <Text
                        style={[styles.errorText]}
                      >
                        {errors.company_id}
                      </Text>
                    )}
                    <Text style={[styles.label, styles.pl15, styles.pb5, { color: "#000" }]}>
                      Номер счёта
                    </Text>
                    <TextInput
                      style={[styles.input, styles.ph15, styles.mb10, styles.pv10, { marginLeft: 0 }]}
                      placeholderTextColor={"#9A9A9A"}
                      placeholder="Номер"
                      keyboardType="numeric"
                      onChangeText={text => setFieldValue('account_number', text)}
                      value={values.account_number}
                    />
                    <Text style={[styles.label, styles.pl15, styles.pb5, { color: "#000" }]}>
                      Дата счёта
                    </Text>
                    <View style={[styles.searchInputContainer, styles.mb10]}>
                      <TouchableOpacity style={[styles.input, styles.mh10, styles.ml10]}
                        onPress={() => switchDatePicker()}>
                        <Text
                          style={[styles.pdv5, styles.fs14, values.date ? {} : { opacity: 0.3 }]}>{values.date || "Выберите дату"}</Text>
                      </TouchableOpacity>
                    </View>
                    <DateTimePickerModal
                      isVisible={isDatePickerVisible}
                      mode="date"
                      onConfirm={(date) => {
                        handleChange("date")(formatDate(dayjs(date)));
                        switchDatePicker();
                      }}
                      onCancel={() => switchDatePicker()}
                    />
                    <Text style={[styles.label, styles.pl15, styles.pb5, { color: "#000" }]}>
                      Сумма закупа
                    </Text>
                    <TextInput
                      style={[styles.input, styles.ph15, styles.mb10, styles.pv10, { marginLeft: 0 }]}
                      placeholderTextColor={"#9A9A9A"}
                      placeholder="Сумма"
                      keyboardType="numeric"
                      onChangeText={(text) => {
                        const formattedText = formatMoneyInput(text);
                        handleChange("amount")(formattedText);
                      }}
                      onBlur={handleBlur("amount")}
                      value={values.amount}
                    />
                    {touched.amount && errors.amount && (
                      <Text
                        style={[styles.errorText]}
                      >
                        {errors.amount}
                      </Text>
                    )}
                    <Text style={[styles.label, styles.pl15, styles.pb5, { color: "#000" }]}>
                      Продажная сумма
                    </Text>
                    <TextInput
                      style={[styles.input, styles.ph15, styles.mb10, styles.pv10, {marginLeft: 0}]}
                      placeholderTextColor={"#9A9A9A"}
                      placeholder="Сумма"
                      keyboardType="numeric"
                      onChangeText={(text) => {
                        const formattedText = formatMoneyInput(text);
                        handleChange("selling_price")(formattedText);
                      }}
                      onBlur={handleBlur("selling_price")}
                      value={values.selling_price}
                    />
                    {touched.selling_price && errors.selling_price && (
                      <Text
                        style={[styles.errorText]}
                      >
                        {errors.selling_price}
                      </Text>
                    )}
                    <Text style={[styles.label, styles.pl15, styles.pb5, { color: "#000" }]}>
                      Наименование организации
                    </Text>
                    <TextInput
                      style={[styles.input, styles.ph15, styles.mb10, styles.pv10, { marginLeft: 0 }]}
                      placeholderTextColor={"#9A9A9A"}
                      placeholder="Организация"
                      onChangeText={text => setFieldValue('organization', text)}
                      value={values.organization}
                      editable={false}
                    />
                    {touched.organization && errors.organization && (
                      <Text
                        style={[styles.errorText]}
                      >
                        {errors.organization}
                      </Text>
                    )}
                    <Text style={[styles.label, styles.pl15, styles.pb5, { color: "#000" }]}>
                      Наименование товара
                    </Text>
                    <TextInput
                      style={[styles.input, styles.ph15, styles.mb10, styles.pv10, { marginLeft: 0 }]}
                      placeholderTextColor={"#9A9A9A"}
                      placeholder="Товар"
                      onChangeText={text => setFieldValue('product_name', text)}
                      value={values.product_name}
                      editable={false}
                    />
                    {touched.product_name && errors.product_name && (
                      <Text
                        style={[styles.errorText]}
                      >
                        {errors.product_name}
                      </Text>
                    )}
                    <View
                      style={[styles.pt14, {
                        flexDirection: "row",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }]}>
                      <Text style={[styles.pl15]}>Дополнительные расходы</Text>
                      <TouchableOpacity onPress={() => {
                        handleAddExpense(setFieldValue, values);
                      }} style={[styles.addButtonWrapper, { width: "30%" }]}>
                        <View style={[styles.fja, styles.pv5, styles.ph5]}>
                          <Plus color={"#fff"} />
                          <Text style={[styles.addButton]}>Добавить</Text>
                        </View>
                      </TouchableOpacity>
                    </View>
                    {
                      values.expenses.map((expense, index) => (
                        <View style={[styles.pt10, { flexDirection: "row", justifyContent: "space-between" }]} key={index}>
                          <TextInput
                            style={[styles.input, styles.ph10, { marginLeft: 0, width: "48%" }]}
                            placeholderTextColor={"#9A9A9A"}
                            placeholder="Название"
                            onChangeText={text => {
                              setFieldValue(`expenses[${index}].name`, text);
                              setExpensesError("")
                            }}
                            value={values.expenses[index].name}
                          />
                          <TextInput
                            style={[styles.input, styles.ph10, { marginLeft: 0, width: "48%" }]}
                            placeholderTextColor={"#9A9A9A"}
                            placeholder="Сумма"
                            keyboardType="numeric"
                            onChangeText={text => {
                              setFieldValue(`expenses[${index}].amount`, text);
                              setExpensesError("")
                            }}
                            value={String(values.expenses[index].amount)}
                          />
                        </View>
                      ))
                    }
                    {expensesError && (<Text style={[styles.errorText]}>{expensesError}</Text>)}
                    <Text style={[styles.expenseName, styles.fs20, styles.ph15, styles.pt20pb10]}>
                      {`Общий расход: ${formatMoney(parseFloat(String(values?.amount)?.replace(/\s/g, '') || 0) + values?.expenses?.reduce((acc, expense) => acc + parseFloat(String(expense?.amount)?.replace(/\s/g, '') || 0), 0))} сом`}
                    </Text>

                    <Button title={'Отправить'} style={{ marginHorizontal: 0 }} callback={handleSubmit} />
                  </View>
                )}
              </Formik>
            )
            : <Loader />
        }
      </ScrollView>
    </SafeAreaView>
  );
};
