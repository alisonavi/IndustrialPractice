import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from "react-native";
import { styles } from "../../styles/styles";
import * as React from "react";
import { Formik } from "formik";
import { HugeAccept, HugeDeny } from "../../constants/icons/LoginLogo";
import { formatDate } from "../../helpers/FormatDate";
import { useDispatch, useSelector } from "react-redux";
import { updateOtherAccount } from "../../redux/accounts/accountsSlice";
import { ADMIN, DENIED, DONE, IN_PROGRESS } from "../../constants/constants";
import { showToaster } from "../../redux/modals/modalsSlice";
import { sendNotification } from "../../redux/notifications/notificationsSlice";
import { FontAwesomeIcon } from "@fortawesome/react-native-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import Button from "../../components/AddButton/AddButton";
import { formatMoney } from "../../helpers/FormatMoney";
import { updateBalance } from "../../redux/users/userSlice";

export default function AdvanceScreen({ navigation, route }) {
  const { advance } = route.params;
  const dispatch = useDispatch();
  const user = useSelector(store => store.user);

  const handleRequest = (data, actionType) => {
    if (actionType === 'accept') {
      if (user.balance < parseFloat(data.total)) return alert("Недостаточно средств на балансе");

      dispatch(updateBalance({ id: data.user_id, balance: parseFloat(data.total) }));
      console.log("updating:", { id: data.id, status: IN_PROGRESS })
      dispatch(updateOtherAccount({ id: data.id, status: IN_PROGRESS }))
        .unwrap()
        .then((result) => {
          if (result) {
            dispatch(showToaster({ type: "success", message: "Запрос сотруднника подтвержден!" }));
            console.log("sending notification:", {
              user_id: data.user_id,
              title: "Tender Community",
              body: `${user.name} ${user.last_name} принял ваш запрос на аванс!`,
              sender: user.id,
              receiver: data.user_id,
              link: "AdvanceScreen",
              param1: `${data.id}`
            });
            dispatch(sendNotification({
              user_id: data.user_id,
              title: "Tender Community",
              body: `${user.name} ${user.last_name} принял ваш запрос на аванс!`,
              sender: user.id,
              receiver: data.user_id,
              link: "AdvanceScreen",
              param1: `${data.id}`
            }))
            navigation.goBack();
          }
        })
        .catch((err) => {
          console.error('Failed to update user', err);
        });
    } else if (actionType === 'deny') {
      dispatch(updateOtherAccount({ id: data.id, status: DENIED }))
        .unwrap()
        .then((result) => {
          if (result) {
            // console.log("User updated", result);
            dispatch(showToaster({ type: "success", message: "Запрос сотрудника отклонен!" }));
            dispatch(sendNotification({
              user_id: data.user_id,
              title: "Tender Community",
              body: `К сожалению, ${user.name} ${user.last_name} отклонил ваш запрос на аванс!`,
              sender: user.id,
              receiver: data.user_id,
              link: "AdvanceScreen",
              param1: `${data.id}`
            }))
            navigation.goBack();
          }
        })
        .catch((err) => {
          console.error('Failed to update user', err);
        });
    } else if (actionType === 'close') {
      // dispatch(updateBalance({id: data.user_id, balance: `-${parseFloat(data.total)}`}));
      dispatch(updateOtherAccount({ id: data.id, status: DONE }))
        .unwrap()
        .then((result) => {
          if (result) {
            dispatch(showToaster({ type: "success", message: "Счет закрыт!" }));
            dispatch(sendNotification({
              user_id: data.user_id,
              title: "Tender Community",
              body: `${user.name} ${user.last_name} закрыл ваш счёт на аванс!`,
              sender: user.id,
              receiver: data.user_id
            }))
            navigation.goBack();
          }
        })
        .catch((err) => {
          console.error('Failed to update user', err);
        });
    }
  };

  return (
    <SafeAreaView edges={['left', 'right', 'top']} style={{ flex: 1, backgroundColor: "#ffffff" }}>
      {/* <StatusBar barStyle="light-content" backgroundColor={"#FFF"}/> */}
      <View style={[styles.smallPaddingBottom, styles.pl30]}>
        <View style={[{ flexDirection: "row" }]}>
          <TouchableOpacity style={[styles.secondaryHeader, styles.pr10, { justifyContent: "center", paddingBottom: 0 }]}
            onPress={() => navigation.goBack()}>
            <FontAwesomeIcon icon={faArrowLeft} size={20} style={[{ color: "#000", }]} />
          </TouchableOpacity>
          <Text style={[styles.secondaryHeader, { paddingBottom: 0 }]}>{`${advance.username || "Сотрудник"}`}</Text>
        </View>
        <Text style={[styles.employeeInfo, styles.fs13, { color: "#9a9a9a" }]}>{formatDate(advance.date)}</Text>
      </View>
      <ScrollView>
        <View style={[styles.ph15, styles.pb40]}>
          <Text style={[styles.label, styles.pl15, styles.pb5, { color: "#000" }]}>
            Описание
          </Text>
          <TextInput
            style={[styles.input, styles.ph15, styles.mb10, styles.pv10, { marginLeft: 0, textAlignVertical: "top" }]}
            value={advance.description}
            numberOfLines={5}
            editable={false}
          />
          <Text style={[styles.label, styles.pl15, styles.pb5, { color: "#000" }]}>
            Сумма запроса
          </Text>
          <TextInput
            style={[styles.input, styles.ph15, styles.mb10, styles.pv10, { marginLeft: 0 }]}
            value={`${formatMoney(advance.total)} сом`}
            editable={false}
          />
        </View>
      </ScrollView>
      {
        user.role === ADMIN && advance.status === IN_PROGRESS && (
          <Button callback={() => {
            handleRequest(advance, 'close')
          }} title={"Закрыть счёт"} />
        )
      }
      {
        user.role === ADMIN && advance.status === 1
          ? (
            <View style={[styles.smallCardWithDots, styles.ph15, styles.mh15]}>
              <Formik initialValues={{
                user_id: advance.user_id,
                id: advance.id,
                total: String(advance.total),
              }} onSubmit={(values) => handleRequest(values, 'accept')}>
                {({ handleChange, handleBlur, values, setFieldValue, handleSubmit }) => (
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
                      <TouchableOpacity style={[{ justifyContent: "center" }]}
                        onPress={() => handleRequest(values, 'deny')}>
                        <HugeDeny />
                        <Text>Отклонить</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[{ justifyContent: "center" }]} onPress={handleSubmit}>
                        <HugeAccept />
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