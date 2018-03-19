package main

import (
	_ "test/routers"
	"github.com/astaxie/beego"
	"./routers"
)

func main() {
	routers.Init()
	beego.SetStaticPath("/static", "static")
	beego.Run()
}

