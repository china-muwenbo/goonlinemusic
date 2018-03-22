package controllers

import (
	"github.com/astaxie/beego"
	_ "github.com/go-sql-driver/mysql"
	"../models"
	"encoding/json"
	"fmt"
)

type MainController struct {
	beego.Controller
}
type GetMusicController struct {
	beego.Controller
}
func (c *MainController) Get() {
	c.Data["Website"] = "beego.me"
	c.Data["Email"] = "astaxie@gmail.com"
	c.TplName = "index.html"
	c.XSRFFormHTML()
}

func (c *GetMusicController) Get() {
	r:=new(Result)

	cp,_ := c.GetInt("cp",0)
	_ = c.GetString("need_page")
	r.Currentpage =cp;
	music,total:=models.GetMusic(cp)
	r.Total =total
	r.Music =music
	//cc:=make([]string,4)
	//cc[0]="1"
	//cc[1]="1"
	//cc[2]="1"
	//cc[3]="1"

	j,err:=json.Marshal(r)
	fmt.Println(string(j))
	if err !=nil{
	}
	c.Data["json"]=music
	c.ServeJSON()
	//c.Ctx.WriteString(string(j))




}

type Result struct {
	Currentpage int                `json:"cp"`
	Total       int                `json:"total"`
	Music       []models.Musicinfo `json:"music"`
}

func (c *GetMusicController) Post() {

}


