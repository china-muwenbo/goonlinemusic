package models

import (
	"github.com/go-xorm/xorm"
	"fmt"
	_ "github.com/go-sql-driver/mysql"
	"github.com/go-xorm/core"
)

type Cached struct {
	Cachedkey string `xorm:"VARCHAR(200)"`
	Id        int    `xorm:"not null pk INT(11)"`
}


func HasCached(name string) bool{
	var err error
	var engine *xorm.Engine
	engine, err = xorm.NewEngine("mysql", GetSQLUrl())
	if err !=nil {
		fmt.Println(err)
	}
	engine.ShowSQL(true)
	engine.Logger().SetLevel(core.LOG_DEBUG)
	if err !=nil{
		fmt.Println("引擎开启失败",err)
	}
	boo,err := engine.Table("cached").Where("cachedkey = ?", name).Exist()
	defer  engine.Close()
	return boo

}
func AddCached(name string){

	var err error
	var engine *xorm.Engine
	engine, err = xorm.NewEngine("mysql", GetSQLUrl())
	if err !=nil {
		fmt.Println(err)
	}
	engine.ShowSQL(true)
	engine.Logger().SetLevel(core.LOG_DEBUG)
	if err !=nil{
		fmt.Println("引擎开启失败",err)
	}

	boo,err := engine.Table("cached").Where("cachedkey = ?", name).Exist()
	if boo {
		return
	}
	c:=new(Cached)
	c.Cachedkey=name
	success,err:=engine.Insert(c)
	if err !=nil {
		fmt.Println(err)
	}
	fmt.Println(success)

}

