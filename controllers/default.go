package controllers

import (
	"github.com/astaxie/beego"
	_ "github.com/go-sql-driver/mysql"
	"goonlinemusic/models"
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
	c.Data["json"]=models.GetMusic()
	c.ServeJSON()

}
func (c *GetMusicController) Post() {
	c.Data["json"]=models.GetMusic()
	c.ServeJSON()
}


