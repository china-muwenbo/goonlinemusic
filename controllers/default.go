package controllers

import (
	"github.com/astaxie/beego"
	"github.com/go-xorm/xorm"
	"fmt"
	_ "github.com/go-sql-driver/mysql"
	"github.com/go-xorm/core"
)

type MainController struct {
	beego.Controller
}
type GetMusicController struct {
	beego.Controller
}
type searchMusicController struct {
	beego.Controller
}
type searchMusicByTitleController struct {
	beego.Controller
}


func (c *MainController) Get() {
	c.Data["Website"] = "beego.me"
	c.Data["Email"] = "astaxie@gmail.com"
	c.TplName = "index.html"
	c.XSRFFormHTML()
}

func (c *GetMusicController) Get() {
	c.Data["json"]=getMusic()
	c.ServeJSON()

}
func (c *GetMusicController) Post() {
	c.Data["json"]=getMusic()
	c.ServeJSON()
}
func (c *searchMusicController) Get() {
	c.Data["json"]=getMusic()
	c.ServeJSON()

}
func (c *searchMusicController) Post() {

	c.Data["json"]=getMusic()
	c.ServeJSON()
}

func (c *searchMusicByTitleController) Get() {
	c.Data["json"]=getMusic()
	c.ServeJSON()

}

func (c *searchMusicByTitleController) Post() {
	c.Data["json"]=getMusic()
	c.ServeJSON()
}



//root:muwenbo@tcp(123.207.215.205:3306)/go?charset=utf8



type Musicinfo struct {

	Url        string `xorm:"not null index VARCHAR(200)" json:"mp3"`
	Duration   string `xorm:"not null VARCHAR(200)" json:"duration"`
	Title      string `xorm:"not null VARCHAR(200)" json:"title"`
	Artist     string `xorm:"default '未知' VARCHAR(200)" json:"artist"`
	Background string `xorm:"VARCHAR(200)" json:"Background"`
	Cover      string `xorm:"VARCHAR(200)" json:"cover"`
}
//基于歌手名的搜索
func SearchMusicByName(name string,page int ) []Musicinfo {
	var err error
	var engine *xorm.Engine
	engine, err = xorm.NewEngine("mysql", "root:muwenbo@tcp(123.207.215.205:3306)/music?charset=utf8")
	engine.ShowSQL(true)
	engine.Logger().SetLevel(core.LOG_DEBUG)
	if err !=nil{
		fmt.Println("引擎开启失败",err)
	}
	ss:=make([]Musicinfo,0)
	engine.Where("musicinfo.artist=?",name).Limit(200,1).Find(&ss)
	fmt.Println(ss)
	engine.Close()
	return ss
}
//基于音乐名的搜索
//SELECT * FROM `music`.`musicinfo` WHERE `title` LIKE '%等你%' LIMIT 0, 1000;
func SearchMusicByMusicName(name string,page int ) []Musicinfo {
	var err error
	var engine *xorm.Engine
	engine, err = xorm.NewEngine("mysql", "root:muwenbo@tcp(123.207.215.205:3306)/music?charset=utf8")
	engine.ShowSQL(true)
	engine.Logger().SetLevel(core.LOG_DEBUG)
	if err !=nil{
		fmt.Println("引擎开启失败",err)
	}
	ss:=make([]Musicinfo,0)
	engine.SQL("select * from musicinfo where musicinfo.title LIKE ?","%"+name+"%").Limit(100).Find(&ss)

	fmt.Println(ss)
	engine.Close()
	return ss
}




//首页音乐
func getMusic() []Musicinfo {
	var err error
	var engine *xorm.Engine
	engine, err = xorm.NewEngine("mysql", "root:muwenbo@tcp(123.207.215.205:3306)/music?charset=utf8")
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

