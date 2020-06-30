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
import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import com.google.appengine.api.datastore.PreparedQuery;
import com.google.appengine.api.datastore.Query;
import com.google.appengine.api.datastore.Query.SortDirection;
import com.google.appengine.api.datastore.FetchOptions;

import com.google.sps.data.UserOU;

/** The servlet stores all child OUs except the root OU into datastore. */
@WebServlet("/user-storechildou")
public class UserStoreChildOUServlet extends HttpServlet {
  @Override
  public void doPost(HttpServletRequest request, HttpServletResponse response) throws IOException {
    UserService userService = UserServiceFactory.getUserService();
    
    String jsonString = request.getReader().lines().collect(Collectors.joining(System.lineSeparator()));

    Gson gson = new Gson();
    UserOU ouObject = gson.fromJson(jsonString, UserOU.class);

    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
    Entity ou = new Entity("ou");
    ou.setProperty("name", ouObject.getName());
    ou.setProperty("path", ouObject.getPath());
    ou.setProperty("parentpath", ouObject.getParentPath());
    ou.setProperty("depth", ouObject.getDepth());
    datastore.put(ou);

    response.setContentType("application/json;");
    response.getWriter().println(gson.toJson("{Success Child OU}"));
  }
}