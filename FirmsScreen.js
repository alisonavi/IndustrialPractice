import {styles} from "../../styles/styles";
import * as React from 'react';
import {useCallback, useEffect, useState} from 'react';
import {ScrollView, StatusBar, Text, TouchableWithoutFeedback, View} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {useDispatch, useSelector} from "react-redux";
import {fetchFirms, fetchFirmsDebts} from "../../redux/firms/firmsSlice";
import {addFirm} from "../../redux/modals/modalsSlice";
import Loader from "../../components/loader/Loader";
import SecondaryHeader from "../../components/secondaryHeader/SecondaryHeader";
import {ADD_FIRM, ADMIN, DELETE_FIRM, EDIT_FIRM, EMPLOYEE} from "../../constants/constants";
import AddFirmModal from "../../modals/firms/AddFirmModal";
import EditFirmModal from "../../modals/firms/EditFirmModal";
import Button from "../../components/AddButton/AddButton";
import Card from "../../components/firmsCards/FirmsCards";
import DeleteFirm from "../../modals/confirmaion/DeleteFirm";
import {fetchEmployeeAccountRealizations, fetchPermissions} from "../../redux/employees/employeeSlice";
import {useFocusEffect} from "@react-navigation/native";
import {resetFilters} from "../../redux/modals/filtersSlice";
import {fetchFirmAccountRealizations} from "../../redux/accounts/accountsSlice";
import {getDateRange} from "../../helpers/FormatDate";

const { startDate, endDate } = getDateRange();

export default function FirmsScreen({navigation}) {
  const [expandedFirms, setExpandedFirms] = useState([]);
  const dispatch = useDispatch();
  const firms = useSelector(store => store.firms);
  const modals = useSelector(store => store.modals);
  const user = useSelector(store => store.user);
  const employee = useSelector(store => store.employee);
  const search = useSelector(store => store.search);
  const accounts = useSelector(store => store.accounts);

  useEffect(() => {
    dispatch(fetchFirmsDebts())
    user.role === ADMIN
      ? dispatch(fetchFirms())
      : dispatch(fetchPermissions(user.id))
  }, []);

  useEffect(() => {
    if (user.role === ADMIN) {
      if (firms.firms && firms.firms.length !== 0) {
        firms.firms.forEach(firm => {
          console.log("FirmsScreen: fetching admin", firm);
          dispatch(fetchFirmAccountRealizations({
            start_date: startDate,
            end_date: endDate,
            user_id: parseInt(user.id),
            company_id: firm.id
          }));
        });
      }
    } else if (user.role === EMPLOYEE) {
      if (employee.permissions && employee.permissions !== 0) {
        employee.permissions.forEach(permission => {
          console.log("FirmsScreen: fetching employee", permission);
          dispatch(fetchEmployeeAccountRealizations({
            start_date: startDate,
            end_date: endDate,
            user_id: parseInt(user.id),
            company_id: permission.company_id
          }))
        });
      }
    }
  }, [firms.firms, employee.permissions]);

  useFocusEffect(useCallback(() => {
    dispatch(resetFilters());
  }, []));

  if (user.role === ADMIN && firms.isLoading && accounts.isRealizationsLoading) return <Loader/>;
  if (user.role === EMPLOYEE && employee.isLoading && employee.isRealizationsLoading) return <Loader/>;
  return (
    <SafeAreaView edges={['left', 'right', 'top']} style={{flex: 1, backgroundColor: "#ffffff"}}>
      {/* <StatusBar barStyle="light-content" backgroundColor={"#fff"}/> */}
      <SecondaryHeader title={"История счетов"} navigation={navigation} searchbar={true}
                       data={user.role === ADMIN ? (firms.firms && firms.firms) : (employee.permissions && employee.permissions)}/>
      <ScrollView>
        <View style={[styles.smallMarginTop]}>
          <TouchableWithoutFeedback
            onPress={() => {
              navigation.navigate('AdvancesScreen')
            }}>
            <View style={[styles.ph15]}>
              <View style={[styles.smallCardWithDots,]}>
                <View style={[styles.ml10, styles.pv10]}>
                  <Text style={[styles.employeeName]}>Авансы</Text>
                  <Text style={[styles.employeeInfo, styles.fs13, {color: "#9a9a9a"}]}>Список авансов/долгов</Text>
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
          <Card navigation={navigation}
                firms={search.query ? search.filteredData : (user.role === ADMIN ? firms.firms : employee.permissions)}
                expandedFirms={expandedFirms} setExpandedFirms={setExpandedFirms}/>
        </View>
      </ScrollView>
      {user.role === ADMIN && <Button title={"Добавить фирму"} callback={() => {
        dispatch(addFirm(ADD_FIRM))
      }}/>}

      {modals.modal === ADD_FIRM && <AddFirmModal/>}
      {modals.modal === EDIT_FIRM && <EditFirmModal/>}
      {modals.modal === DELETE_FIRM && <DeleteFirm title={"фирму"}/>}
    </SafeAreaView>
  );
};