import {SafeAreaView} from "react-native-safe-area-context";
import {ActivityIndicator, ScrollView, StatusBar, Text, View} from "react-native";
import {styles} from "../../styles/styles";
import SearchGroup from "../../components/searchbar/SearchGroup";
import * as React from "react";
import Card from "../../components/accountsCards/AccountsCards";
import {useDispatch, useSelector} from "react-redux";
import {useCallback, useEffect} from "react";
import {fetchAccounts, fetchUserAccounts} from "../../redux/accounts/accountsSlice";
import {addAccount} from "../../redux/modals/modalsSlice";
import {ADD_ACCOUNT, ADMIN} from "../../constants/constants";
import AddAccountModal from "../../modals/accounts/AddAccountModal";
import {resetDateFilter, resetFilters} from "../../redux/modals/filtersSlice";
import {cleanUpQuery, setFilteredData} from "../../redux/search/searchSlice";
import {handleSearch} from "../../helpers/SearchHandler";
import {applyFilters} from "../../helpers/Filters";
import {useFocusEffect} from "@react-navigation/native";
import Button from "../../components/AddButton/AddButton";

export default function AccountsScreen({navigation}) {
  const user = useSelector(store => store.user);
  const modals = useSelector(store => store.modals);
  const searchDispatcher = useSelector(store => store.search);
  const accounts = useSelector(store => store.accounts);
  const filters = useSelector(store => store.filters);
  const dispatch = useDispatch();

  const handleAddAccount = () => {
    dispatch(addAccount(ADD_ACCOUNT))
  }

  const onSearch = () => {
    dispatch(setFilteredData(handleSearch(filteredAccounts, searchDispatcher.query)));
  }

  useEffect(() => {
    user.role === ADMIN ? dispatch(fetchAccounts()) : dispatch(fetchUserAccounts(user.id));
  }, []);

  useFocusEffect(
    useCallback(() => {
      return () => {
        dispatch(cleanUpQuery());
        dispatch(resetDateFilter());
      };
    }, [])
  );

  const filteredAccounts = applyFilters(accounts.accounts, filters, filters.apply);
  return (
    <SafeAreaView edges={['left', 'right', 'top']} style={{flex: 1, backgroundColor: "#ffffff"}}>
      {/* <StatusBar barStyle="light-content" backgroundColor={"#f1f1f1"}/> */}
      <View style={[styles.pb40, styles.mb20, styles.reportsHeader, {
        backgroundColor: "#f1f1f1",
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
        borderBottomLeftRadius: 10,
        borderBottomRightRadius: 10,
      }]}>
        <Text style={[styles.secondaryHeader, styles.pl30]}>{user.role === ADMIN ? 'Счета' : 'История счетов'}</Text>
      </View>
      <SearchGroup data={filteredAccounts} navigation={navigation} buttonType={user.role === ADMIN ? "Add" : "default"}
                   onClickButton={() => {
                     user.role === ADMIN ? handleAddAccount() : onSearch()
                   }}
                   callback={() => navigation.navigate("AccountOperationsScreen")}
                   containerStyle={styles.smallPaddingBottom} searchWithoutButton={user.role === ADMIN ? true : false}/>
      {
        searchDispatcher.query && searchDispatcher.filteredData.length === 0
        ? <ActivityIndicator color={"f1f1f1"} size={"large"} />
        : <ScrollView>
            <View style={[styles.smallMarginTop]}>
              <Card navigation={navigation}
                    filteredAccounts={searchDispatcher.query && searchDispatcher.filteredData.length > 0 ? searchDispatcher.filteredData : filteredAccounts}/>
            </View>
          </ScrollView>
      }
      {
        modals.modal === ADD_ACCOUNT
          ? <AddAccountModal/>
          : null
      }
    </SafeAreaView>
  );
};