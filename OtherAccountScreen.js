import {SafeAreaView} from "react-native-safe-area-context";
import {ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View} from "react-native";
import {styles} from "./../../styles/styles";
import {Formik} from "formik";
import {useDispatch, useSelector} from "react-redux";
import * as React from "react";
import {DONE, ADMIN, DENIED, PENDING, IN_PROGRESS} from "../../constants/constants";
import {formatDate} from "../../helpers/FormatDate";
import {HugeAccept, HugeDeny} from "../../constants/icons/LoginLogo";
import dayjs from "dayjs";
import {fetchAdvance, fetchTender, updateAccount, updateOtherAccount} from "../../redux/accounts/accountsSlice";
import {showToaster} from "../../redux/modals/modalsSlice";
import {sendNotification} from "../../redux/notifications/notificationsSlice";
import {FontAwesomeIcon} from "@fortawesome/react-native-fontawesome";
import {faArrowLeft} from "@fortawesome/free-solid-svg-icons";
import {formatMoney} from "../../helpers/FormatMoney";
import {useEffect, useState} from "react";
import Loader from "../../components/loader/Loader";
import {loadData} from "../../services/fetchUser";
import Button from "../../components/AddButton/AddButton";

export default function OtherAccountScreen({navigation, route}) {
  const account = route?.params?.account || null;
  const id = route?.params?.id || null;
  const [naccount, setNaccount] = useState(null);
  const dispatch = useDispatch();
  const user = useSelector(store => store.user);
  account && console.log("Account", account);
  const handleRequest = (data, actionType) => {
    if (actionType === 'accept') {
      if (user.balance < data.amount) return dispatch(showToaster({type: "error", message: "Недостаточно средств на балансе"}));
      dispatch(updateOtherAccount({
        id: data.id,
        status: IN_PROGRESS,
        description: data.description,
        total: data.total,
        name: data.username,
        // date: dayjs(account?.date).format('YYYY-MM-DD HH:mm:ss'),
        date: (account?.date || naccount?.date),
        user_id: data.user_id,
      }))
        .unwrap()
        .then((result) => {
          if (result) {
            // console.log("User updated", result);
            dispatch(showToaster({type: "success", message: "Запрос сотруднника подтвержден!"}));
            dispatch(sendNotification({
              user_id: data.user_id,
              title: "Tender Community",
              body: `${user.name} ${user.last_name} принял ваш запрос на аванс!`,
              sender: user.id,
              receiver: data.user_id,
              link: "OtherAccountScreen",
              param1: `${data.id}`
            }))
            navigation.goBack();
          }
        })
        .catch((err) => {
          // Обработка ошибки здесь
          console.error('Failed to update user', err);
        });
    } else if (actionType === 'deny') {
      // console.log("date", dayjs(account?.date).format('YYYY-MM-DD HH:mm:ss'));
      dispatch(updateOtherAccount({
        id: data.id,
        status: DENIED,
        description: data.description,
        total: data.total,
        name: data.username,
        // date: dayjs(account?.date).format('YYYY-MM-DD HH:mm:ss'),
        date: (account?.date || naccount?.date),
        user_id: data.user_id,
      }))
        .unwrap()
        .then((result) => {
          if (result) {
            dispatch(showToaster({type: "success", message: "Запрос сотрудника отклонен!"}));
            dispatch(sendNotification({
              user_id: data.user_id,
              title: "Tender Community",
              body: `К сожалению, ${user.name} ${user.last_name} отклонил ваш запрос на аванс!`,
              sender: user.id,
              receiver: data.user_id,
              link: "OtherAccountScreen",
              param1: `${data.id}`
            }))
            navigation.goBack();
          }
        })
        .catch((err) => {
          // Обработка ошибки здесь
          console.error('Failed to update user', err);
        });
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      if (!user.id) {
        try {
          await loadData(dispatch);
        } catch (e) {
          console.error("Error loading data:", e);
        }
      }
      if (!account && id) {
        try {
          const res = await dispatch(fetchAdvance(parseInt(id))).unwrap();
          if (res) {
            console.log("Advance fetched:", res);
            setNaccount(res);
          }
        } catch (e) {
          console.error("Error fetching advance:", e);
        }
      }
    };
  
    fetchData();
  }, [account, id, dispatch, user.id]);  

  if((!id || !naccount) && !account) return <Loader />;
  return (
    <SafeAreaView edges={['left', 'right', 'top']} style={{flex: 1, backgroundColor: "#ffffff"}}>
      {/* <StatusBar barStyle="light-content" backgroundColor={"#FFF"}/> */}
      <View style={[styles.smallPaddingBottom, styles.pl30]}>
        <View style={[{flexDirection: "row"}]}>
          <TouchableOpacity style={[styles.secondaryHeader,styles.pr10, {justifyContent: "center", paddingBottom: 0}]} onPress={() => navigation.goBack()}>
            <FontAwesomeIcon icon={faArrowLeft} size={20} style={[ {color: "#000",}]} />
          </TouchableOpacity>
          <Text style={[styles.secondaryHeader, {paddingBottom: 0}]}>{`${(account?.username || naccount?.username) || (account?.name || naccount?.name)}`}</Text>
        </View>
        <Text style={[styles.employeeInfo, styles.fs13, {color: "#9a9a9a"}]}>{formatDate(account?.date || naccount?.date)}</Text>
      </View>
      <ScrollView>
        <View style={[styles.ph15, styles.pb40]}>
          <View style={[styles.accountDescriptionWrapper, styles.smallMarginTop]}>
            <Text numberOfLines={6} style={[styles.expenseAmount, styles.ph15, styles.pv10]}>{`Описание: ${(account?.description || naccount?.description)}`}</Text>
            {/* <Text style={[styles.expenseAmount, styles.ph15, styles.pv10]}>{`Описание: ${JSON.stringify(account || naccount, null, 2)}`}</Text> */}
          </View>
          <View style={[styles.accountDescriptionWrapper, styles.smallMarginTop]}>
            <Text
              style={[styles.expenseAmount, styles.ph15, styles.pv10]}>{`Сумма: ${formatMoney(account?.total || naccount?.total)} сом`}</Text>
          </View>
        </View>
      </ScrollView>
      {
        user.role === ADMIN && (account || naccount).status === IN_PROGRESS && (
          <Button callback={() => {
            handleRequest((account || naccount), 'close')
          }} title={"Закрыть счёт"} />
        )
      }
      {user.role === ADMIN && (account?.status || naccount?.status) === PENDING
        ? (
          <View style={[styles.smallCardWithDots, styles.ph15, styles.mh15]}>
            <Formik initialValues={{
              id: (account?.id || naccount?.id),
              username: (account?.name || naccount?.name),
              user_id: (account?.user_id || naccount?.user_id),
              date: (account?.date || naccount?.date),
              description: (account?.description || naccount?.description),
              total: (account?.total || naccount?.total),
              status: (account?.status || naccount?.status),
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