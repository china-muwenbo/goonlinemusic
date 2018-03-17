package models

import (
	"github.com/go-xorm/xorm"
	"fmt"
	"github.com/go-xorm/core"
)

type Musicinfo struct {
	Url        string `xorm:"not null index VARCHAR(200)" json:"mp3"`
	Duration   string `xorm:"not null VARCHAR(200)" json:"duration"`
	Title      string `xorm:"not null VARCHAR(200)" json:"title"`
	Artist     string `xorm:"default '未知' VARCHAR(200)" json:"artist"`
	Background string `xorm:"VARCHAR(200)" json:"Background"`
	Cover      string `xorm:"VARCHAR(200)" json:"cover"`
}

//基于音乐名的搜索
func SearchMusicByName(name string,page int ) []Musicinfo {
	var err error
	var engine *xorm.Engine
	engine, err = xorm.NewEngine("mysql", GetSQLUrl())
	engine.ShowSQL(true)
	engine.Logger().SetLevel(core.LOG_DEBUG)
	if err !=nil{
		fmt.Println("引擎开启失败",err)
	}
	ss:=make([]Musicinfo,0)
	//sql 对limit 不起作用
	engine.SQL("select * from musicinfo where musicinfo.artist LIKE ? limit 0,200 ","%"+name+"%"  ).Limit(100,2).Find(&ss)
	fmt.Println(ss)
	engine.Close()
	return ss
}


//基于音乐名的搜索
//SELECT * FROM `music`.`musicinfo` WHERE `title` LIKE '%等你%' LIMIT 0, 1000;
func SearchMusicByMusicName(name string,page int ) []Musicinfo {
	var err error
	var engine *xorm.Engine
	engine, err = xorm.NewEngine("mysql", GetSQLUrl())
	engine.ShowSQL(true)
	engine.Logger().SetLevel(core.LOG_DEBUG)
	if err !=nil{
		fmt.Println("引擎开启失败",err)
	}
	ss:=make([]Musicinfo,0)
	engine.SQL("select * from musicinfo where musicinfo.title LIKE ? limit 0,200","%"+name+"%").Limit(100,2).Find(&ss)
	fmt.Println(ss)
	engine.Close()
	return ss
}

//首页音乐
func GetMusic() []Musicinfo {
	var err error
	var engine *xorm.Engine
	engine, err = xorm.NewEngine("mysql", GetSQLUrl())
	engine.ShowSQL(true)
	engine.Logger().SetLevel(core.LOG_DEBUG)
	if err !=nil{
		fmt.Println("引擎开启失败",err)
	}
	ss:=make([]Musicinfo,0)
	engine.SQL("select * from musicinfo limit 0,200 ").Find(&ss)
	fmt.Println(ss)
	engine.Close()
	return ss
}

