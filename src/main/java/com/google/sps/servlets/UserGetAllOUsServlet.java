package com.google.sps.servlets;

import com.google.appengine.api.datastore.DatastoreService;
import com.google.appengine.api.datastore.DatastoreServiceFactory;
import com.google.appengine.api.datastore.Entity;
import java.io.IOException;
import java.io.BufferedReader;
import java.util.Arrays;
import java.util.ArrayList;
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
import org.json.simple.JSONObject;

import com.google.sps.data.UserOU;
import com.google.sps.data.UserOUNode;

@WebServlet("/get-ous")
public class UserGetAllOUsServlet extends HttpServlet {  
  @Override
  public void doGet(HttpServletRequest request, HttpServletResponse response) throws IOException {
    Query query = new Query("ou").addSort("depth", SortDirection.ASCENDING);
    
    DatastoreService datastore = DatastoreServiceFactory.getDatastoreService();
    PreparedQuery results = datastore.prepare(query);

    // get all OUs in list except the root
    List<UserOU> ous = new ArrayList<UserOU>();
    for (Entity entity : results.asIterable()) {
      UserOU userOU = toUserOU(entity);
      ous.add(userOU);
    }

    // get the root OU and create a root node
    Query rootQuery = new Query("root");
    Entity rootEntity = datastore.prepare(rootQuery).asList(FetchOptions.Builder.withDefaults()).get(0);
    UserOU rootOU = toUserOU(rootEntity);
    UserOUNode root = new UserOUNode(rootOU);

    // build the tree from root
    for(UserOU ou: ous){
        String parentPath = ou.getParentPath();
        UserOUNode parentNode = UserOUNode.getNodeByPath(root, parentPath);
        parentNode.addChild(ou);
    }

    // convert the tree to JSON
    JSONObject json = UserOUNode.toJSON(root, root.getChildren());

    response.setContentType("application/json;");
    response.getWriter().println(json);
  }

  // convert Entity to a UserOU object
  public UserOU toUserOU(Entity entity){
      String name = (String) entity.getProperty("name");
      String path = (String) entity.getProperty("path");
      String parentPath = (String) entity.getProperty("parentpath");
      long depthLong = (long) entity.getProperty("depth");
      int depth = (int) depthLong;

      UserOU userOU = new UserOU(name, path, parentPath, depth);
      return userOU;
  }
}

