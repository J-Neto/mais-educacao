import React, { useEffect } from "react";
import { View, StyleSheet, Text, Image } from "react-native";
import { Surface } from "react-native-paper";
import Icon from "react-native-vector-icons/FontAwesome5";
import Icon2 from "react-native-vector-icons/MaterialIcons";
import Icon3 from "react-native-vector-icons/AntDesign";
import { useNavigation } from "@react-navigation/native";

export const AppHeader2 = () => {
  const navigation = useNavigation();

  return (
    <Surface style={styles.header}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={{ marginLeft: 15 }}>
            <Icon3
              name="arrowleft"
              size={25}
              color="#fff"
              style={{ alignItems: "center" }}
              onPress={() => navigation.goBack()}
            />
          </View>

          <View style={{ marginLeft: 10 }}>
            <Image
              style={{ width: 120 }}
              resizeMode="contain"
              source={require("../../../assets/logo.png")}
            />
          </View>
        </View>

        <View style={{ flexDirection: "row", marginHorizontal: 10 }}>
          <View style={{ marginHorizontal: 20 }}>
            <Icon2
              name="notifications-none"
              size={25}
              color="#fff"
              style={{ alignItems: "center" }}
            />
          </View>

          <View>
            <Icon2
              name="person"
              size={25}
              color="#fff"
              onPress={() => navigation.navigate("Perfil")}
            />
          </View>
        </View>
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: 35,
    height: 90,
    backgroundColor: "#4263EB",
  },
});
