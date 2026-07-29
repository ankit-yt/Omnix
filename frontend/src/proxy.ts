import { NextRequest, NextResponse } from "next/server";

const PUBLIC_ROUTES = [
  "/login",
  "/register",
]

export function proxy(request:NextRequest){
  const {pathname} = request.nextUrl;

  const isPublicRoute = PUBLIC_ROUTES.some((route)=>
    pathname.startsWith(route) || pathname == "/"
  );

  const hasRefreshToken = request.cookies.has("refreshToken");
  console.log(hasRefreshToken);
  console.log(isPublicRoute)
  if(isPublicRoute && hasRefreshToken){
    return NextResponse.redirect(new URL("/dashboard",request.url))
  };

  if(!isPublicRoute && !hasRefreshToken){
    const loginUrl = new URL("/login",request.url);
    
    loginUrl.searchParams.set("callback",pathname);

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
