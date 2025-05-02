import * as React from 'react';
import {ScrollView, StatusBar, Text, View, TouchableOpacity} from "react-native";
import {SafeAreaView} from "react-native-safe-area-context";
import {useDispatch, useSelector} from "react-redux";
import {
  applyFilter, filterByAccountAmount, filterByAccountDate,
  filterByAmount,
  filterByCategory,
  filterByDate,
  filterByEmployee, resetDateFilter,
  resetFilters, setStatusFilter, setTypeFilter
} from "../../redux/modals/filtersSlice";
import SecondaryHeader from "../../components/secondaryHeader/SecondaryHeader";
import {
  dateOperations,
  employeeOperations,
  statusOperations,
  sumOperations,
  typeOperations
} from "../../constants/Operations";
import {styles} from "../../styles/styles";
import {Dot} from "../../constants/icons/LoginLogo";
import Button from "../../components/AddButton/AddButton";
import {useFocusEffect} from "@react-navigation/native";
import {useCallback, useState} from "react";
import {cleanUpQuery} from "../../redux/search/searchSlice";
import {ADMIN} from "../../constants/constants";
import {
  fetchFirmTransactions,
  fetchTenders,
  fetchUserAccountsWithCompany,
  fetchUserTenders
} from "../../redux/accounts/accountsSlice";

export default function AccountOperationsScreen({navigation}) {
  const [isFiltering, setIsFiltering] = useState(false);
    const filters = useSelector(store => store.filters);
    const user = useSelector(store => store.user);
    const firm = useSelector(store => store.firms.currentFirm);
    const dispatch = useDispatch();
    const handleDatePress = (type) => {
      if(type === "period") return navigation.navigate("AccountCalendarScreen");
      setIsFiltering(true);
      dispatch(filterByAccountDate(type));
      setIsFiltering(false);
    }
    const handleStatusPress = (type) => {
      setIsFiltering(true);
      dispatch(setStatusFilter(type));
      setIsFiltering(false);
    }
    const handleTypePress = (type) => {
      setIsFiltering(true);
      switch (type) {
        case "Закуп":
          user.role === ADMIN
            ? dispatch(fetchFirmTransactions(firm.id))
            : dispatch(fetchUserAccountsWithCompany({user_id: user.id, company_id: firm.company_id}));
          dispatch(setTypeFilter(type));
          break;
        case "ГОПП и ГОИК":
          user.role === ADMIN
            ? dispatch(fetchTenders())
            : dispatch(fetchUserTenders(user.id))
          dispatch(setTypeFilter(type));
          break;
      }
      setIsFiltering(false);
    }
    const handleAmountPress = (type) => {
      setIsFiltering(true);
      dispatch(filterByAccountAmount(type));
      setIsFiltering(false);
    }
    const handleEmployeePress = (type) => {
      setIsFiltering(true);
      dispatch(filterByEmployee(type));
      setIsFiltering(false);
    }
    const handleApply = () => {
      navigation.goBack();
    }

    return (
      <SafeAreaView edges={['left', 'right', 'top']} style={{flex: 1, backgroundColor: "#ffffff"}}>
          {/* <StatusBar barStyle="light-content" backgroundColor={"#fff"} /> */}
          <ScrollView>
              <SecondaryHeader title={"Показать операции"} navigation={navigation} searchbar={false} />
              <View>
                  <View style={[styles.ph15]}>
                      <Text style={[styles.ph5, styles.expenseName, styles.smallPaddingBottom]}>По типу</Text>
                    {typeOperations.map((operation, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[styles.smallCardWithDots, {alignItems: "center"}]}
                        onPress={() => handleTypePress(operation.value)}
                      >
                        <View style={[styles.ml10, styles.pv10]}>
                          <Text style={[styles.expenseAmount]}>{operation.operationName}</Text>
                        </View>
                        <View style={[styles.mr10]}>
                          <Dot color={filters.typeFilter.type === operation.value ? "#00DD3E" : "#fff"}
                               stroke={filters.typeFilter.type === operation.value ? "#00DD3E" : "#000"}
                          />
                        </View>
                      </TouchableOpacity>
                    ))}
                    <Text style={[styles.ph5, styles.expenseName, styles.smallPaddingBottom]}>По статусу</Text>
                    {statusOperations.map((operation, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[styles.smallCardWithDots, {alignItems: "center"}]}
                        onPress={() => handleStatusPress(operation.value)}
                      >
                        <View style={[styles.ml10, styles.pv10]}>
                          <Text style={[styles.expenseAmount]}>{operation.operationName}</Text>
                        </View>
                        <View style={[styles.mr10]}>
                          <Dot color={filters.statusFilter.type === operation.value ? "#00DD3E" : "#fff"}
                               stroke={filters.statusFilter.type === operation.value ? "#00DD3E" : "#000"}
                          />
                        </View>
                      </TouchableOpacity>
                    ))}
                    <Text style={[styles.ph5, styles.expenseName, styles.smallPaddingBottom]}>По дате</Text>
                      {dateOperations.map((operation, index) => (
                        <TouchableOpacity
                          key={index}
                          style={[styles.smallCardWithDots, {alignItems: "center"}]}
                          onPress={() => handleDatePress(operation.value)}
                        >
                            <View style={[styles.ml10, styles.pv10]}>
                                <Text style={[styles.expenseAmount]}>{operation.operationName}</Text>
                            </View>
                            <View style={[styles.mr10]}>
                                <Dot color={filters.dateAccountFilter.type === operation.value ? "#00DD3E" : "#fff"}
                                     stroke={filters.dateAccountFilter.type === operation.value ? "#00DD3E" : "#000"}
                                />
                            </View>
                        </TouchableOpacity>
                      ))}
                      {/*<Text style={[styles.ph5, styles.expenseName, styles.smallPaddingBottom]}>По сумме</Text>*/}
                      {/*{sumOperations.map((operation, index) => (*/}
                      {/*  <TouchableOpacity*/}
                      {/*    key={index}*/}
                      {/*    style={[styles.smallCardWithDots, {alignItems: "center"}]}*/}
                      {/*    onPress={() => handleAmountPress(operation.value)}>*/}
                      {/*      <View style={[styles.ml10, styles.pv10]}>*/}
                      {/*          <Text style={[styles.expenseAmount]}>{operation.operationName}</Text>*/}
                      {/*      </View>*/}
                      {/*      <View style={[styles.mr10]}>*/}
                      {/*        <Dot color={filters.amountAccountFilter.type === operation.value ? "#00DD3E" : "#fff"}*/}
                      {/*             stroke={filters.amountAccountFilter.type === operation.value ? "#00DD3E" : "#000"}*/}
                      {/*        />*/}
                      {/*      </View>*/}
                      {/*  </TouchableOpacity>*/}
                      {/*))}*/}
                      {user.role === ADMIN && <Text style={[styles.ph5, styles.expenseName, styles.smallPaddingBottom]}>По сотрудникам</Text>}
                      {user.role === ADMIN && employeeOperations.map((operation, index) => (
                        <TouchableOpacity
                          key={index}
                          style={[styles.smallCardWithDots, {alignItems: "center"}]}
                          onPress={() => handleEmployeePress(operation.value)}
                        >
                            <View style={[styles.ml10, styles.pv10]}>
                                <Text style={[styles.expenseAmount]}>{operation.operationName}</Text>
                            </View>
                            <View style={[styles.mr10]}>
                              <Dot color={filters.employeeFilter.type === operation.value ? "#00DD3E" : "#fff"}
                                   stroke={filters.employeeFilter.type === operation.value ? "#00DD3E" : "#000"}
                              />
                            </View>
                        </TouchableOpacity>
                      ))}
                  </View>
              </View>
            <View style={{width: "100%", flexDirection: "row", justifyContent: "space-around"}}>
              <Button title={"Сбросить"} style={{width: "40%"}} callback={() => dispatch(resetFilters())} />
              <Button title={"Применить"} style={{width: "40%"}} callback={() => handleApply()} />
            </View>
          </ScrollView>
      </SafeAreaView>
    );
}
