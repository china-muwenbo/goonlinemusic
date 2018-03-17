package controllers

import (
	"github.com/astaxie/beego"
	"goonlinemusic/models"
)

type SearchMusicByTitleController struct {
	beego.Controller
}
//根据歌名搜索
func (c *SearchMusicByTitleController) Get() {
	serach_content := c.GetString("serach_content")
	_ = c.GetString("need_page")
	c.Data["json"]=models.SearchMusicByMusicName(serach_content,0)
	c.ServeJSON()

}

func (c *SearchMusicByTitleController) Post() {
	serach_content := c.GetString("serach_content")
	_ = c.GetString("need_page")
	c.Data["json"]=models.SearchMusicByMusicName(serach_content,0)
	c.ServeJSON()
}


