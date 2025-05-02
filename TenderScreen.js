import {SafeAreaView} from "react-native-safe-area-context";
import {ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View} from "react-native";
import {styles} from "../../styles/styles";
import * as React from "react";
import {Formik} from "formik";
import {HugeAccept, HugeDeny} from "../../constants/icons/LoginLogo";
import {formatDate} from "../../helpers/FormatDate";
import {useDispatch, useSelector} from "react-redux";
import {deleteTender, fetchTender, updateAccount, updateTender} from "../../redux/accounts/accountsSlice";
import {DONE, ADMIN, DENIED, IN_PROGRESS} from "../../constants/constants";
import {showToaster} from "../../redux/modals/modalsSlice";
import {sendNotification} from "../../redux/notifications/notificationsSlice";
import {FontAwesomeIcon} from "@fortawesome/react-native-fontawesome";
import {faArrowLeft} from "@fortawesome/free-solid-svg-icons";
import Button from "../../components/AddButton/AddButton";
import {formatMoney} from "../../helpers/FormatMoney";
import {updateBalance} from "../../redux/users/userSlice";
import {useEffect, useState} from "react";
import Loader from "../../components/loader/Loader";
import {loadData} from "../../services/fetchUser";

export default function TenderScreen({navigation, route}) {
  const account = route?.params?.account || null;
  const id = route?.params?.id || null;
  const [naccount, setNaccount] = useState(null);
  const dispatch = useDispatch();
  const user = useSelector(store => store.user);

  const handleRequest = (data, actionType) => {
    try {
      if (actionType === 'accept') {
        const userId = account?.user_id || naccount?.user_id;
        const totalBalance = parseFloat((account?.total || naccount?.total) + (account?.commission || naccount?.commission));
        const accountType = account?.type || naccount?.type;
        const accountId = account?.id || naccount?.id;

        if (user.balance < totalBalance) return alert("Недостаточно средств на балансе");

        dispatch(updateBalance({ id: userId, balance: totalBalance }));
        dispatch(updateTender({ id: data.id, status: IN_PROGRESS }))
          .unwrap()
          .then((result) => {
            if (result) {
              dispatch(showToaster({ type: "success", message: "Запрос сотруднника подтвержден!" }));
              dispatch(sendNotification({
                user_id: userId,
                title: "Tender Community",
                body: `${user.name} ${user.last_name} принял ваш запрос на ${accountType}!`,
                sender: user.id,
                receiver: userId,
                link: "TenderScreen",
                param1: `${accountId}`,
              }));
              navigation.goBack();
            }
          })
          .catch((err) => {
            console.error('Failed to update user', err);
          });
      } else if (actionType === 'deny') {
        const userId = account?.user_id || naccount?.user_id;
        const accountType = account?.type || naccount?.type;
        const accountId = account?.id || naccount?.id;

        dispatch(deleteTender(data.id))
          .unwrap()
          .then((result) => {
            if (result) {
              dispatch(showToaster({ type: "success", message: "Запрос сотрудника отклонен!" }));
              dispatch(sendNotification({
                user_id: userId,
                title: "Tender Community",
                body: `К сожалению, ${user.name} ${user.last_name} отклонил ваш запрос на ${accountType}!`,
                sender: user.id,
                receiver: userId,
                link: "TenderScreen",
                param1: `${accountId}`,
              }));
              navigation.goBack();
            }
          })
          .catch((err) => {
            console.error('Failed to update user', err);
          });
      } else if (actionType === 'close') {
        const userId = account?.user_id || naccount?.user_id;
        const accountType = account?.type || naccount?.type;
        const accountId = account?.id || naccount?.id;
        const tenderNumber = account?.tender_number || naccount?.tender_number;

        dispatch(updateTender({ id: data.id, status: DONE }))
          .unwrap()
          .then((result) => {
            if (result) {
              dispatch(showToaster({ type: "success", message: "Счет закрыт!" }))
              dispatch(sendNotification({
                user_id: userId,
                title: "Tender Community",
                body: `${user.name} ${user.last_name} закрыл счёт на ${accountType}!\nНомер тендера: ${tenderNumber}`,
                sender: user.id,
                receiver: userId,
                link: "TenderScreen",
                param1: `${accountId}`,
              }))
              navigation.goBack()
            }
          })
          .catch((err) => {
            console.error('Failed to update user', err);
          });
      }
    } catch (error) {
      console.error('Error handling request:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user.id) {
        await loadData(dispatch);
      }
      if (!account && id) {
        console.log("passing:", parseInt(id));
        try {
          const res = await dispatch(fetchTender(parseInt(id))).unwrap();
          if (res) {
            console.log("Tender fetched", res);
            setNaccount(res);
          }
        } catch (e) {
          console.log("Error fetching tender", e);
        }
      }
    };

    fetchData();
  }, [account, id, dispatch]);

  if(!account && !naccount) return <Loader />;
  return (
    <SafeAreaView edges={['left', 'right', 'top']} style={{flex: 1, backgroundColor: "#ffffff"}}>
      {/* <StatusBar barStyle="light-content" backgroundColor={"#FFF"}/> */}
      <View style={[styles.smallPaddingBottom, styles.pl30]}>
        <View style={[{flexDirection: "row"}]}>
          <TouchableOpacity style={[styles.secondaryHeader,styles.pr10, {justifyContent: "center", paddingBottom: 0}]} onPress={() => navigation.goBack()}>
            <FontAwesomeIcon icon={faArrowLeft} size={20} style={[ {color: "#000",}]} />
          </TouchableOpacity>
          <Text style={[styles.secondaryHeader, {paddingBottom: 0}]}>{`${account?.username || naccount?.username}`}</Text>
        </View>
        <Text style={[styles.employeeInfo, styles.fs13, {color: "#9a9a9a"}]}>{formatDate(account?.date || naccount?.date)}</Text>
      </View>
      <ScrollView>
        <View style={[styles.ph15, styles.pb40]}>
          <View style={[styles.accountDescriptionWrapper, styles.smallMarginTop]}>
            <Text style={[styles.expenseAmount, styles.ph15, styles.pv10]}>{`Тип: ${account?.type || naccount?.type}`}</Text>
          </View>
          <View style={[styles.accountDescriptionWrapper, styles.smallMarginTop]}>
            <Text
              style={[styles.expenseAmount, styles.ph15, styles.pv10]}>{`Номер тендера: ${account?.tender_number || naccount?.tender_number}`}</Text>
          </View>
          <View style={[styles.accountDescriptionWrapper, styles.smallMarginTop]}>
            <Text style={[styles.expenseAmount, styles.ph15, styles.pv10]}>{`Дата: ${formatDate(account?.completed_date || naccount?.completed_date)}`}</Text>
          </View>
          <View style={[styles.accountDescriptionWrapper, styles.smallMarginTop]}>
            <Text
              style={[styles.expenseAmount, styles.ph15, styles.pv10]}>{`Сумма: ${formatMoney(parseFloat(account?.total || naccount?.total))} сом`}</Text>
          </View>
          <View style={[styles.accountDescriptionWrapper, styles.smallMarginTop]}>
            <Text style={[styles.expenseAmount, styles.ph15, styles.pv10]}>{`Комиссия: ${formatMoney(account?.commission || naccount?.commission)} сом`}</Text>
          </View>
          <View style={[styles.accountDescriptionWrapper, styles.smallMarginTop]}>
            <Text
              style={[styles.expenseAmount, styles.ph15, styles.pv10]}>{`Название фирмы: ${account?.companyname || naccount?.companyname}`}</Text>
          </View>
          <View style={[styles.accountDescriptionWrapper, styles.smallMarginTop]}>
            <Text
              style={[styles.expenseAmount, styles.ph15, styles.pv10]}>{`Организация: ${account?.organization || naccount?.organization}`}</Text>
          </View>
        </View>
      </ScrollView>
      {
        user.role === ADMIN && (account?.status || naccount?.status) === IN_PROGRESS && (
          <Button callback={() => {handleRequest(account || naccount, 'close')}} title={"Закрыть счёт"} />
        )
      }
      {
        user.role === ADMIN && (account?.status || naccount?.status) === 1
        ? (
          <View style={[styles.smallCardWithDots, styles.ph15, styles.mh15]}>
            <Formik initialValues={{
              id: (account?.id || parseInt(naccount?.id)),
              total: String(account?.total || naccount?.total + account?.commission || naccount?.commission),
            }} onSubmit={(values) => handleRequest(values, 'accept')}>
              {({handleChange, handleBlur, values, setFieldValue, handleSubmit}) => (
                <View>
                  <TextInput
                    style={styles.accountInput}
                    name="amount"
                    id="amount"
                    keyboardType={"decimal-pad"}
                    onChangeText={(text) => {
                      const numericValue = text.replace(/[^0-9.]/g, '');
                      setFieldValue('total', numericValue);
                    }}
                    onBlur={handleBlur('total')}
                    value={`Сумма пополнения: ${values.total}`}
                  />
                  <View style={[styles.pht, styles.pt20pb10, {
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    width: "100%"
                  }]}>
                    <TouchableOpacity style={[{justifyContent: "center"}]}
                                      onPress={() => handleRequest(values, 'deny')}>
                      <HugeDeny/>
                      <Text>Отклонить</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[{justifyContent: "center"}]} onPress={handleSubmit}>
                      <HugeAccept/>
                      <Text>Разрешить</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </Formik>
          </View>
        )
        : null}
    </SafeAreaView>
  );
};