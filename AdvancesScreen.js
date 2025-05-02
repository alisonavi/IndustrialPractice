import * as React from "react";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { ADMIN, DENIED, DONE, IN_PROGRESS, PENDING } from "../../constants/constants";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, StatusBar, Text, TouchableWithoutFeedback, View } from "react-native";
import SecondaryHeader from "../../components/secondaryHeader/SecondaryHeader";
import { styles } from "../../styles/styles";
import { fetchAdvances, fetchEmployeeAdvances } from "../../redux/accounts/accountsSlice";
import Card from "../../components/advanceCards/Card";
import { formatMoney } from "../../helpers/FormatMoney";
import { formatDate } from "../../helpers/FormatDate";
import { DoubleCheck, SmallAccept, SmallClock, SmallDeny } from "../../constants/icons/LoginLogo";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";

export default function AdvancesScreen({ navigation }) {
  const dispatch = useDispatch();
  const user = useSelector(store => store.user);
  const accounts = useSelector(store => store.accounts);

  useEffect(() => {
    user.role === ADMIN ? dispatch(fetchAdvances()) : dispatch(fetchEmployeeAdvances(user.id))
  }, []);

  useFocusEffect(useCallback(() => {
    user.role === ADMIN ? dispatch(fetchAdvances()) : dispatch(fetchEmployeeAdvances(user.id))
  }, []));

  const onPressAdvance = (advance) => {
    navigation.navigate('AdvanceListScreen', { advance });
  };

  return (
    <SafeAreaView edges={['left', 'right', 'top']} style={{ flex: 1, backgroundColor: "#ffffff" }}>
      {/* <StatusBar barStyle="light-content" backgroundColor={"#fff"}/> */}
      <SecondaryHeader title={"Авансы"} navigation={navigation} searchbar={true}
        data={user.role === ADMIN ? null : null} />
      <ScrollView>
        <View style={[styles.smallMarginTop]}>
          {user.role === ADMIN
            ? (
              accounts.advances && accounts.advances.length !== 0 && accounts.advances.map((advance, index) => (
                <TouchableWithoutFeedback onPress={() => onPressAdvance(advance)} key={index}>
                  <View style={[styles.ph15]}>
                    <View style={[styles.smallCardWithDots]}>
                      <View style={[styles.ml10, { width: "90%" }]}>
                        <View style={[styles.pb5, { flexDirection: "row", justifyContent: "space-between" }]}>
                          <Text style={[styles.employeeName, styles.fs16]}>{advance.name + " " + advance.last_name}</Text>
                        </View>
                        <View style={[styles.pb5, { flexDirection: "row", justifyContent: "space-between" }]}>
                          <Text style={[styles.expenseAmount]}>{
                            `Долг: ${formatMoney(advance.difference)} сом`
                          }</Text>
                        </View>
                      </View>
                      <View style={[styles.fja, styles.pl5]}>
                        {advance.status === IN_PROGRESS ? <SmallAccept /> : null}
                        {advance.status === DONE ? <DoubleCheck /> : null}
                        {advance.status === PENDING ? <SmallClock /> : null}
                        {advance.status === DENIED ? <SmallDeny /> : null}
                      </View>
                    </View>
                  </View>
                </TouchableWithoutFeedback>
              ))
            )
            : <Card navigation={navigation} advances={user.role === ADMIN ? accounts.advances : accounts.employeeAdvances} />}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};