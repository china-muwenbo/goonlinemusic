package models

import (
	"fmt"
	"github.com/garyburd/redigo/redis"
)


func hasMusicNameKey(name string) bool{
	return true
}


func GetMusicArtistFrom(name string ) (string,error){
	c, err := 	redis.Dial("tcp", "123.207.215.205:6379")
	if err != nil {
		fmt.Println(err)
		return "",err
	}
	err=c.Send("auth","muwenbo")
	re,err:=redis.String(c.Do("get",name))
	fmt.Println(re)
	defer c.Close()
	return re,err

}


//缓存key 和value
func SetMusicArtist(name string,value interface{}){
	c, err := 	redis.Dial("tcp", "123.207.215.205:6379")
	if err != nil {
		fmt.Println(err)
		return
	}
	err=c.Send("auth","muwenbo")
	c.Do("set",name,value)
	defer c.Close()
}