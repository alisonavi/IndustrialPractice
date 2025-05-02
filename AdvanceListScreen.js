import * as React from "react";
import {useEffect, useState} from "react";
import {useDispatch, useSelector} from "react-redux";
import {ADMIN, DENIED, DONE, IN_PROGRESS, PENDING} from "../../constants/constants";
import {SafeAreaView} from "react-native-safe-area-context";
import {ScrollView, StatusBar, Text, TouchableWithoutFeedback, View} from "react-native";
import SecondaryHeader from "../../components/secondaryHeader/SecondaryHeader";
import {styles} from "../../styles/styles";
import {fetchAdvances, fetchEmployeeAdvances} from "../../redux/accounts/accountsSlice";
import Card from "../../components/advanceCards/Card";
import {formatMoney} from "../../helpers/FormatMoney";
import {formatDate} from "../../helpers/FormatDate";
import {DoubleCheck, SmallAccept, SmallClock, SmallDeny} from "../../constants/icons/LoginLogo";
import { useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";

export default function AdvanceListScreen({navigation, route}) {
  const {advance} = route.params;
  const [employeeAdvances, setEmployeeAdvances] = useState([]);
  const dispatch = useDispatch();
  const user = useSelector(store => store.user);

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        console.log("fetching employee's advances")
        try {
          dispatch(fetchEmployeeAdvances(advance.id)).then((result) => {
            setEmployeeAdvances(result.payload);
          });
        } catch (error) {
          console.error("Error fetching employee advances:", error);
        }
      };
  
      fetchData();
    }, [dispatch, advance.id])
  );

  return (
    <SafeAreaView edges={['left', 'right', 'top']} style={{flex: 1, backgroundColor: "#ffffff"}}>
      {/* <StatusBar barStyle="light-content" backgroundColor={"#fff"}/> */}
      <SecondaryHeader title={"Авансы"} navigation={navigation} searchbar={true}
                       data={user.role === ADMIN ? null : null}/>
      <ScrollView>
        <View style={[styles.smallMarginTop]}>
          <Card navigation={navigation} advances={employeeAdvances} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};