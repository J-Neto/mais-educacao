import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import React, { useContext, useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { AppHeader2 } from "../../components/AppHeader2";
import { AuthContext } from "../../context/AuthContext";

export const Conteudos = ({route}) => {
    const { userInfo } = useContext(AuthContext)
    const [ conteudos, setConteudos ] = useState([])
    const [ titulo, setTitulo ] = useState("")
    const navigation = useNavigation();
    let id = route.params.id;

    //get nos conteudos do alunos po rmateria
     useEffect(() => {
         axios.get(`http://192.168.6.20:3010/conteudosAluno/${userInfo.user.id}/${id}`)
         .then(res=>{
             // s
             setConteudos(res.data['conteudo'].conteudo);
             setTitulo(res.data['conteudo'].disciplina_name);
             console.log(res.data['conteudo'].conteudo)
         })
        
       }, [])

       
    return (
        <View style={styles.Container}>
        <AppHeader2/>
        <View>                
            <Text style={styles.text}> {titulo} </Text>
        </View>

        <ScrollView>
        {conteudos.map((cont)=>(
            <TouchableOpacity key={cont.id} onPress={() => navigation.navigate('VideoAulas', {id: `${cont.id}`})}>
                <View style={{padding:10}} key={cont.id}>
                 <View style={styles.container2}>
                        <Text style={styles.text1}> {cont.name}</Text>
                    </View>
                        
                </View>
            </TouchableOpacity>
 
            ))}
        </ScrollView>
        
    </View>
    )
}

export const styles = StyleSheet.create({
    Container: {
        flex: 1,
        backgroundColor: '#EDF2FF'
    },
    text:{
        color: "#403B91",
        fontSize: 18,
        fontWeight: "500",
        marginLeft: 20,
        marginBottom: 10,
        marginTop: 10
    },
    container2:{
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: "#fff",
        paddingVertical: 10,
        borderRadius: 20
        

    },
    text1:{
        color: "#403B91",
        fontSize: 16,
        fontWeight: "500",
        justifyContent: 'center',
        alignItems: 'center',
        
    }
    

})