package controllers

import (
	"fmt"
	"github.com/astaxie/beego"
	"goonlinemusic/models"
)
//根据艺术家的名字搜索
type SearchMusicController struct {
	beego.Controller
}

func (c *SearchMusicController) Get() {
	serach_content := c.GetString("serach_content")
	_ = c.GetString("need_page")
	fmt.Println(""+serach_content)
	c.Data["json"]=models.SearchMusicByName(serach_content,0)
	c.ServeJSON()
}
//根据歌手名搜索
func (c *SearchMusicController) Post() {
	serach_content := c.GetString("serach_content")
	_ = c.GetString("need_page")
	c.Data["json"]=models.SearchMusicByName(serach_content,0)
	c.ServeJSON()
}