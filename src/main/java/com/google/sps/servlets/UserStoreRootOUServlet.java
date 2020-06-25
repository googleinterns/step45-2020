package com.google.sps.servlets;

import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import java.io.IOException;
import java.io.BufferedReader;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import com.google.gson.Gson;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import com.google.appengine.api.users.User;
import com.google.appengine.api.users.UserService;
import com.google.appengine.api.users.UserServiceFactory;
import com.google.appengine.api.datastore.PreparedQuery;
import com.google.appengine.api.datastore.Query;
import com.google.appengine.api.datastore.Query.SortDirection;

import com.google.sps.data.UserOU;

@WebServlet("/user-storerootou")
public class UserStoreRootOUServlet extends HttpServlet {
  @Override
  public void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
    UserService userService = UserServiceFactory.getUserService();
    
    String jsonString = request.getReader().lines().collect(Collectors.joining(System.lineSeparator()));

    Gson gson = new Gson();
    UserOU rootObject = gson.fromJson(jsonString, UserOU.class);
    
    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
    Entity root = new Entity("root");
    root.setProperty("name", rootObject.getName());
    root.setProperty("path", rootObject.getPath());
    root.setProperty("parentpath", "root has no parent");
    root.setProperty("depth", 1);
   
    datastore.put(root);

    response.setContentType("application/json;");
    response.getWriter().println(gson.toJson("{Success Root OU}"));
  }
}