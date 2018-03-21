package main

import (
	"../models"
	"fmt"
)

func main() {
	//type header struct {
	//	Encryption  string `json:"encryption"`
	//	Timestamp   int64  `json:"timestamp"`
	//	Key         string `json:"key"`
	//	Partnercode int    `json:"partnercode"`
	//}
	//headerO1 := header{
	//	Encryption:  "sha",
	//	Timestamp:   1482463793,
	//	Key:         "2342874840784a81d4d9e335aaf76260",
	//	Partnercode: 10025,
	//}
	//jsons, errs := json.Marshal(headerO1) //转换成JSON返回的是byte[]
	//if errs != nil {
	//	fmt.Println(errs.Error())
	//}
	//fmt.Println(string(jsons)) //byte[]转换成string 输出
	var name = "周杰伦"
	str := models.SearchMusicByName(name, 1)
	models.SetMusicArtist(name, str)
	v, err := models.GetMusicArtistFrom(name)
	if err != nil {
		fmt.Println(err)
	}
	fmt.Println(v)
}
