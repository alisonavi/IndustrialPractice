import {SafeAreaView} from "react-native-safe-area-context";
import {Platform, ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View} from "react-native";
import {styles} from "../../styles/styles";
import * as React from "react";
import {useEffect, useState} from "react";
import {Formik} from "formik";
import {Edit, HugeAccept, HugeDeny, Trash} from "../../constants/icons/LoginLogo";
import {formatDate} from "../../helpers/FormatDate";
import {useDispatch, useSelector} from "react-redux";
import {
  deleteAccount,
  fetchAccountDebt,
  fetchRemainders, fetchTender,
  fetchTranches, fetchTransaction,
  setCurrentRemainder,
  setCurrentTranche,
  updateAccount
} from "../../redux/accounts/accountsSlice";
import {ADMIN, CLOSE_ACCOUNT, DENIED, DONE, IN_PROGRESS, PENDING} from "../../constants/constants";
import {chooseItem, setItemDetails, setModal, showToaster} from "../../redux/modals/modalsSlice";
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import {sendNotification, setToken} from "../../redux/notifications/notificationsSlice";
import {FontAwesomeIcon} from "@fortawesome/react-native-fontawesome";
import {faArrowLeft} from "@fortawesome/free-solid-svg-icons";
import Button from "../../components/AddButton/AddButton";
import {formatMoney} from "../../helpers/FormatMoney";
import dayjs from "dayjs";
import AddTrancheModal from "../../modals/accounts/AddTrancheModal";
import UpdateTrancheModal from "../../modals/accounts/UpdateTrancheModal";
import DeleteTranche from "../../modals/confirmaion/DeleteTranche";
import CloseAccount from "../../modals/confirmaion/CloseAccount";
import PercentagesModal from "../../modals/accounts/PercentagesModal";
import AddRemainderModal from "../../modals/accounts/AddRemainderModal";
import DeleteRemainder from "../../modals/confirmaion/DeleteRemainder";
import UpdateRemainderModal from "../../modals/accounts/UpdateRemainderModal";
import {authenticationCheck, setRole, unauthorized, updateBalance} from "../../redux/users/userSlice";
import Loader from "../../components/loader/Loader";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function AccountScreen({navigation, route}) {
  const account = route?.params?.account || null;
  const id = route?.params?.id || null;
  const [naccount, setNaccount] = useState(null);
  const accounts = useSelector(store => store.accounts);
  const dispatch = useDispatch();
  const user = useSelector(store => store.user);
  const modals = useSelector(store => store.modals);

  const handleRequest = (data, actionType, tranche = null) => {
    try {
      if (actionType === 'accept') {
        if (user.balance < data.amount) return alert("Недостаточно средств на балансе");

        const completedDate = account?.completed_date || naccount?.completed_date;
        const dateObject = dayjs(completedDate);
        const transformedData = dateObject.format('YYYY-MM-DD HH:mm:ss');

        dispatch(updateBalance({id: account?.user_id || naccount?.user_id, balance: `${parseFloat(data.total)}`}));
        dispatch(updateAccount({
          id: data.id,
          status: IN_PROGRESS,
          expenses: data.expenses,
          completed_date: transformedData
        }))
          .unwrap()
          .then((result) => {
            if (result) {
              console.log("try:", JSON.stringify({
                user_id: account?.user_id || naccount?.user_id,
                title: "Tender Community",
                body: `${user.name} ${user.last_name} принял ваш запрос на ${account?.type || naccount?.type}!`,
                sender: user.id,
                receiver: account?.user_id || naccount?.user_id,
                link: "InProgressPurchaseScreen",
                param1: account?.id || naccount?.id,
              }, null, 2));

              dispatch(showToaster({type: "success", message: "Запрос сотруднника подтвержден!"}));
              dispatch(sendNotification({
                user_id: account?.user_id || naccount?.user_id,
                title: "Tender Community",
                body: `${user.name} ${user.last_name} принял ваш запрос на ${account?.type || naccount?.type}!`,
                sender: user.id,
                receiver: account?.user_id || naccount?.user_id,
                link: "InProgressPurchaseScreen",
                param1: `${account?.id || naccount?.id}`,
              }));
              navigation.goBack();
            }
          })
          .catch((err) => {
            console.error('Failed to update user', err);
          });
      }
      else if (actionType === 'deny') {
        const completedDate = account?.completed_date || naccount?.completed_date;
        const dateObject = dayjs(completedDate);
        const transformedData = dateObject.format('YYYY-MM-DD HH:mm:ss');

        dispatch(deleteAccount(data.id))
          .unwrap()
          .then((result) => {
            if (result) {
              dispatch(showToaster({type: "success", message: "Запрос сотрудника отклонен!"}));
              dispatch(sendNotification({
                user_id: data.user_id,
                title: "Tender Community",
                body: `К сожалению, ${user.name} ${user.last_name} отклонил ваш запрос на ${account?.type || naccount?.type}!`,
                sender: user.id,
                receiver: data.user_id
              }));
              navigation.goBack();
            }
          })
          .catch((err) => {
            console.error('Failed to update user', err);
          });
      }
      else if (actionType === 'close') {
        dispatch(setModal(CLOSE_ACCOUNT));
      } else if (actionType === 'tranche') {
        dispatch(setModal('tranche'));
      } else if (actionType === 'updateTranche') {
        dispatch(setModal('updateTranche'));
      } else if (actionType === 'deleteTranche') {
        if (tranche) {
          dispatch(chooseItem(tranche.id));
          dispatch(setItemDetails(tranche));
          dispatch(setModal('deleteTranche'));
        } else {
          console.error('Tranche is null');
        }
      }
      else if (actionType === 'remainder') {
        dispatch(setModal('remainder'));
      } else if (actionType === 'deleteRemainder') {
        if (tranche) {
          dispatch(chooseItem(tranche.id));
          dispatch(setItemDetails(tranche));
          dispatch(setModal('deleteRemainder'));
        } else {
          console.error('Tranche is null');
        }
      }
      else if (actionType === 'updateRemainder') {
        dispatch(setModal('updateRemainder'));
      } else if(actionType === 'percentages') {
        dispatch(setModal('percentages'));
      }
    } catch (error) {
      console.error('Error handling request:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = await AsyncStorage.getItem('user');
        if (token) {
          console.log("user here");
          try {
            const result = await dispatch(authenticationCheck(token)).unwrap();
            if (result.id) {
              dispatch(setRole());
            }
          } catch (err) {
            dispatch(showToaster({ type: "error", message: "Не удалось войти в систему..." }));
            console.error('Failed to update user', err);
          }
        } else {
          dispatch(setToken(notifyToken));
          dispatch(unauthorized());
        }
      } catch (e) {
        console.error(e);
      }
    };

    if (!user?.id) {
      loadData();
    }

    if (account?.id || naccount?.id) {
      dispatch(fetchTranches(account?.id || naccount?.id));
      dispatch(fetchRemainders(account?.id || naccount?.id));
      dispatch(fetchAccountDebt(account?.id || naccount?.id));
    }
  }, [naccount, account, dispatch, user?.id]);

  useEffect(() => {
    if (!account && id) {
      dispatch(fetchTransaction(parseInt(id))).unwrap().then((res) => {
        if (res) {
          console.log("Transaction fetched:", res);
          setNaccount(res);
        }
      }).catch((e) => {
        console.log("Error fetching tender", e);
      });
    }
  }, [account, id, dispatch]);

  if(!account && !naccount) return <Loader />;
  return (
    <SafeAreaView edges={['left', 'right', 'top']} style={{flex: 1, backgroundColor: "#ffffff"}}>
      {/* <StatusBar barStyle="light-content" backgroundColor={"#FFF"}/> */}
      <ScrollView>
        <View style={[styles.smallPaddingBottom, styles.pl30]}>
          <View style={[{flexDirection: "row"}]}>
            <TouchableOpacity
              style={[styles.secondaryHeader, styles.pr10, {justifyContent: "center", paddingBottom: 0}]}
              onPress={() => navigation.goBack()}>
              <FontAwesomeIcon icon={faArrowLeft} size={20} style={[{color: "#000",}]}/>
            </TouchableOpacity>
            <Text style={[styles.secondaryHeader, {paddingBottom: 0}]}>{`${account?.username || naccount?.username}`}</Text>
          </View>
          {(account?.type || naccount?.type) === 'Закуп' && (<Text style={[styles.employeeInfo, styles.fs13, {color: "#9a9a9a"}]}>Дебиторская
            задолженность: {(accounts.currentAccountDebt && accounts.currentAccountDebt.length !== 0 && accounts.currentAccountDebt[0].debt) || 0} сом</Text>)}
        </View>
        <View style={[styles.ph15, styles.pb40]}>
          <View style={[styles.accountDescriptionWrapper, styles.smallMarginTop]}>
            <Text style={[styles.expenseAmount, styles.ph15, styles.pv10]}>{`Тип: ${account?.type || naccount?.type}`}</Text>
          </View>
          <View style={[styles.accountDescriptionWrapper, styles.smallMarginTop]}>
            <Text
              style={[styles.expenseAmount, styles.ph15, styles.pv10]}>{`Номер счёта: ${(account?.transaction_number || naccount?.transaction_number) || "-"}`}</Text>
          </View>
          <View style={[styles.accountDescriptionWrapper, styles.smallMarginTop]}>
            <Text
              style={[styles.expenseAmount, styles.ph15, styles.pv10]}>{`Дата счёта: ${(account?.completed_date || naccount?.completed_date) ? formatDate(account?.completed_date || naccount?.completed_date) : "Счёт не выставлен"}`}</Text>
          </View>
          {((account?.type || naccount?.type) === "ГОКЗ" || (account?.type || naccount?.type) === "ГОПП" || (account?.type || naccount?.type) === "ГОИК") && (account?.tender_number || naccount?.tender_number) && (
            <View style={[styles.accountDescriptionWrapper, styles.smallMarginTop]}>
              <Text
                style={[styles.expenseAmount, styles.ph15, styles.pv10]}>{`Номер тендера: ${(account?.tender_number || naccount?.tender_number)}`}</Text>
            </View>
          )}
          <View style={[styles.accountDescriptionWrapper, styles.smallMarginTop]}>
            <Text
              style={[styles.expenseAmount, styles.ph15, styles.pv10]}>{`Сумма закупа: ${formatMoney(account?.amount || naccount?.amount)} сом`}</Text>
          </View>
          <View style={[styles.accountDescriptionWrapper, styles.smallMarginTop]}>
            <Text
              style={[styles.expenseAmount, styles.ph15, styles.pv10]}>{`Продажная сумма: ${formatMoney(account?.sell || naccount?.sell)} сом`}</Text>
          </View>
          <View style={[styles.accountDescriptionWrapper, styles.smallMarginTop]}>
            <Text
              style={[styles.expenseAmount, styles.ph15, styles.pv10]}>{`Организация: ${account?.organization || naccount?.organization}`}</Text>
          </View>
          <View style={[styles.accountDescriptionWrapper, styles.smallMarginTop]}>
            <Text
              style={[styles.expenseAmount, styles.ph15, styles.pv10]}>{`Товар: ${account?.product_name || naccount?.product_name}`}</Text>
          </View>
          <View style={[styles.accountDescriptionWrapper, styles.smallMarginTop]}>
            <Text
              style={[styles.expenseAmount, styles.ph15, styles.pv10]}>{`Название фирмы: ${account?.companyname || naccount?.companyname}`}</Text>
          </View>
          <View style={[styles.accountDescriptionWrapper, styles.smallMarginTop]}>
            <Text
              style={[styles.expenseAmount, styles.ph15, styles.pv10]}>
              {`Расходов: ${(account?.expenses || naccount?.expenses) && (account?.expenses || naccount?.expenses).length > 0
                ? (account?.expenses || naccount?.expenses).length
                : " нет "}`}
            </Text>
          </View>
          {
            (account?.expenses || naccount?.expenses) && (account?.expenses || naccount?.expenses).length > 0
              ? (account?.expenses || naccount?.expenses).map((expense, index) => (
                <View key={index} style={[styles.accountDescriptionWrapper, styles.smallMarginTop, {
                  flexDirection: "row",
                  alignItems: "center"
                }]}>
                  <FontAwesome name="circle" size={5} color="#000" style={[styles.ph15]}/>
                  <Text style={[styles.expenseAmount, styles.pv10]}>
                    {`${expense.name} - ${formatMoney(expense.amount)} сом`}
                  </Text>
                </View>
              ))
              : null
          }
          {((account?.status || naccount?.status) === DONE || (account?.status || naccount?.status) === IN_PROGRESS) && (
            <View style={[styles.accountDescriptionWrapper, styles.smallMarginTop, {backgroundColor: "#fff"}]}>
              <Text
                style={[styles.expenseAmount, styles.ph15, styles.pv10, {textAlign: "center"}]}>
                {`Оплата: ${accounts.currentTranches && accounts.currentTranches.length > 0
                  ? accounts.currentTranches.length
                  : " 0"}`}
              </Text>
            </View>
          )}
          {
            accounts.currentTranches && accounts.currentTranches.length > 0
              ? accounts.currentTranches.map((tranche, index) => (
                <View key={index} style={[styles.accountDescriptionWrapper, styles.smallMarginTop, {
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between"
                }]}>
                  <View>
                    <View style={[{flexDirection: "row", alignItems: "center"}]}>
                      <FontAwesome name="circle" size={5} color="#000" style={[styles.ph15]}/>
                      <Text style={[styles.expenseAmount, styles.pv10]}>
                        {`${formatMoney(tranche.amount)} сом`}
                      </Text>
                    </View>
                    <Text
                      style={[styles.expenseAmount, styles.ph30, styles.fs13, {color: "#9a9a9a"}]}>{formatDate(tranche.date)}</Text>
                  </View>
                  {
                    (account?.status || naccount?.status) === DONE
                      ? null
                      : <View style={[styles.pr10, styles.pv10]}>
                        <TouchableOpacity style={[styles.pr10, styles.smallPaddingBottom]} onPress={() => {
                          handleRequest(account, 'updateTranche');
                          dispatch(setCurrentTranche(tranche));
                        }}>
                          <Edit/>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => {
                          handleRequest(account, 'deleteTranche', tranche);
                          dispatch(setCurrentTranche(tranche));
                        }}>
                          <Trash/>
                        </TouchableOpacity>
                      </View>
                  }
                </View>
              ))
              : null
          }

          {((account?.status || naccount?.status) === DONE || (account?.status || naccount?.status) === IN_PROGRESS) && (
            <View style={[styles.accountDescriptionWrapper, {backgroundColor: "#fff"}]}>
              <Text
                style={[styles.expenseAmount, styles.ph15, styles.pv10, {textAlign: "center"}]}>
                {`Сдача: ${accounts.currentRemainders && accounts.currentRemainders.length > 0
                  ? accounts.currentRemainders.length
                  : " 0"}`}
              </Text>
            </View>
          )}
          {
            ((account?.status || naccount?.status) === DONE || (account?.status || naccount?.status) === IN_PROGRESS) && accounts.currentRemainders && accounts.currentRemainders.length > 0
              ? accounts.currentRemainders.map((tranche, index) => (
                <View key={index} style={[styles.accountDescriptionWrapper, styles.smallMarginTop, {
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between"
                }]}>
                  <View>
                    <View style={[{flexDirection: "row", alignItems: "center"}]}>
                      <FontAwesome name="circle" size={5} color="#000" style={[styles.ph15]}/>
                      <Text style={[styles.expenseAmount, styles.pv10]}>
                        {`${formatMoney(tranche.amount)} сом`}
                      </Text>
                    </View>
                    <Text
                      style={[styles.expenseAmount, styles.ph30, styles.fs13, {color: "#9a9a9a"}]}>{formatDate(tranche.date)}</Text>
                  </View>
                  {
                    (account?.status || naccount?.status) === DONE
                      ? null
                      : <View style={[styles.pr10, styles.pv10]}>
                        <TouchableOpacity style={[styles.pr10, styles.smallPaddingBottom]} onPress={() => {
                          handleRequest(account, 'updateRemainder');
                          dispatch(setCurrentRemainder(tranche));
                        }}>
                          <Edit/>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => {
                          handleRequest(account, 'deleteRemainder', tranche);
                          dispatch(setCurrentTranche(tranche));
                        }}>
                          <Trash/>
                        </TouchableOpacity>
                      </View>
                  }
                </View>
              ))
              : null
          }
        </View>

        {/*{*/}
        {/*  user.role === ADMIN && (account?.status || naccount?.status) === IN_PROGRESS && (*/}
        {/*    <Button style={[styles.smallMb]} callback={() => {handleRequest(account, 'tranche')}} title={"Зарегистрировать сдачу"} />*/}
        {/*  )*/}
        {/*}*/}
        {
          user.role === ADMIN && (account?.status || naccount?.status) === IN_PROGRESS && (
            <Button
              isDisabled={!(accounts.currentTranches.reduce((accumulator, tranche) => accumulator + tranche.amount, 0) === (account?.sell || naccount?.sell))}
              style={[accounts.currentTranches.reduce((accumulator, tranche) => accumulator + tranche.amount, 0) === (account?.sell || naccount?.sell) ? null : {opacity: 0.6}]}
              callback={() => {
                handleRequest(account, Platform.OS == "ios" ? "percentages" : 'close')
              }} title={"Закрыть счёт"}/>
          )
        }
        {
          user.role === ADMIN && (account?.status || naccount?.status) === IN_PROGRESS && (
            <Button style={[{marginTop: 0}]} callback={() => {
              handleRequest(account, 'remainder')
            }} title={"Зарегистрировать сдачу"}/>
          )
        }

      </ScrollView>

      {/*{*/}
      {/*  user.role === EMPLOYEE && account?.status === IN_PROGRESS && account?.type !== "ГОПП" && account?.type !== "ГОИК" && (*/}
      {/*    <Button callback={() => {handleSendCloseRequest()}} title={"Создать дополнительный счёт"} />*/}
      {/*  )*/}
      {/*}*/}

      {
        user.role === ADMIN && (account?.status || naccount?.status) === IN_PROGRESS && (
          <Button style={[styles.smallMb]} callback={() => {
            handleRequest(account, 'tranche')
          }} title={"Запись об оплате за товар"}/>
        )
      }

      {user.role === ADMIN && (account?.status || naccount?.status) === 1
        ? (
          <View style={[styles.smallCardWithDots, styles.ph15, styles.mh15]}>
            <Formik initialValues={{
              id: parseInt((account?.id || naccount?.id)),
              amount: parseFloat((account?.amount || naccount?.amount)),
              type: (account?.type || naccount?.type),
              tender_number: (account?.tender_number || naccount?.tender_number),
              transaction_number: (account?.transaction_number || naccount?.transaction_number),
              user_id: parseInt((account?.user_id || naccount?.user_id)),
              company_id: parseInt((account?.company_id || naccount?.company_id)),
              organization: (account?.organization || naccount?.organization),
              total: String((account?.total || naccount?.total)),
              status: parseInt((account?.status || naccount?.status)),
              expenses: (account?.expenses || naccount?.expenses),
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
                    value={`Сумма перевода: ${values.total}`}
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
      {
        modals.modal === 'tranche' && (
          <AddTrancheModal account={(account || naccount)} navigation={navigation}/>
        )
      }
      {
        modals.modal === 'updateTranche' && (
          <UpdateTrancheModal account={(account || naccount)} tranche={accounts.currentTranche} navigation={navigation}/>
        )
      }
      {
        modals.modal === 'deleteTranche' && (
          <DeleteTranche title={'оплату'} navigation={navigation}/>
        )
      }
      {
        modals.modal === CLOSE_ACCOUNT && (
          <CloseAccount navigation={navigation} account={(account || naccount)} data={(account || naccount)}/>
        )
      }
      {
        modals.modal === 'percentages' && (
          <PercentagesModal navigation={navigation} account={(account || naccount)}/>
        )
      }
      {
        modals.modal === 'remainder' && (
          <AddRemainderModal account={(account || naccount)} navigation={navigation}/>
        )
      }
      {
        modals.modal === 'deleteRemainder' && (
          <DeleteRemainder navigation={navigation}/>
        )
      }
      {
        modals.modal === 'updateRemainder' && (
          <UpdateRemainderModal account={(account || naccount)} tranche={accounts.currentRemainder} navigation={navigation}/>
        )
      }
    </SafeAreaView>
  );
};