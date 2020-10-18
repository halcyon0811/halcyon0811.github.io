# -*- coding: utf-8 -*-
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
import scipy.spatial.distance as ssd
import json
from scipy.cluster.hierarchy import dendrogram, linkage, fcluster, to_tree

def add_node(node, parent, max_length):
	# First create the new node and append it to its parent's children
	newNode = dict( name = node.id, y = max_length - node.dist, children=[])
	parent["children"].append( newNode )

	# Recursively add the current node's children
	if node.left: add_node( node.left, newNode, max_length )
	if node.right: add_node( node.right, newNode, max_length )

def convert_dendrogram_json(linkage_data, stock_map):
    Tree = to_tree(linkage_data)
    # create the dictionary to store the tree structure
    d3Dendro = dict(name="Pool", y = 0, children = [])
    # recursively add the node into the dictionary
    add_node(Tree, d3Dendro, Tree.dist )
    # trim this dictionary tree format
    trim_tree(d3Dendro, stock_map)
    
    # convert dictionary to json format
    json_dump = json.dumps(d3Dendro, sort_keys=True, indent = 2)
    
    json_out = open("Dendrogram_Data.json",'w')
    json_out.write(json_dump)
    json_out.close()

def convert_force_direct_json(stock_dist_matrix, cluster_group, stock_map, threshold):
    dist_matrix = stock_dist_matrix.values
    dim = len(dist_matrix)
    
    # generate node list
    nodes_list = []
    for i in range(dim):
        nodes_list.append({"id":stock_map[i], "group": int(cluster_group[i])})
    
    # generate link list by the threshold value
    links_list =[]
    for i in range(dim):
        for j in range(dim):
            if i < j and abs(dist_matrix[i][j]) <= threshold :
                links_list.append({"source":stock_map[i], "target":stock_map[j], "value":dist_matrix[i][j]})
    
    # convert dictionary to json format
    json_prep = {"nodes":nodes_list, "links":links_list}
    json_dump = json.dumps(json_prep, sort_keys=True, indent = 2)
    
    json_out = open("Force_Directed_Data.json",'w')
    json_out.write(json_dump)
    json_out.close()
    
def plot_corr_matrix(stock_corr_matrix):
    # plot the correlation matrix
    fig, ax = plt.subplots(figsize = (10,10))
    cax = ax.matshow(stock_corr_matrix, cmap='rainbow')
    plt.xticks(range(len(stock_corr_matrix.columns)), stock_corr_matrix.columns, rotation = 90)
    plt.yticks(range(len(stock_corr_matrix.columns)), stock_corr_matrix.columns)
    
    cbar = fig.colorbar(cax, ticks=[-1,0,1], aspect = 40, shrink = 0.8)
    plt.show()
    
def plot_dendrogram(stock_dist_matrix, stock_map, threshold):
    plt.figure(figsize=(10, 7))  
    plt.title("Stock Dendograms")
    # convert the correlation to condensed matrix
    dist = ssd.squareform(stock_dist_matrix.values)
    # Z is the linkage data structure information
    Z = linkage(dist, method='complete')
    # cluster is the flat cluster result
    cluster_list = fcluster(Z,threshold,'distance')
    # Result is the dendrogram information
    Result = dendrogram(Z, labels = stock_dist_matrix.columns, distance_sort = 'descendent')
    plt.show()
    # convert to dendrogram json
    convert_dendrogram_json(Z, stock_map)
    return cluster_list

def trim_tree(node, stock_map):
    # dict content is name = node.id, distance = node.dist, children=[]
    # If this node is a leaf, change the name and delete the children 
    if len(node["children"]) == 0:
        node["name"] = stock_map[node["name"]]
        node.pop("children")
    # If this node is not leaf, then eliminate the name and iterate every node
    else:
        node["name"] = ""
        for i in range(len(node["children"])):
            trim_tree(node["children"][i], stock_map)
        

if __name__ == '__main__':
    # read time series data
    price_matrix = pd.read_csv("sample_data.csv")
    # drop the unnecessary column
    price_matrix.drop(['date','Unnamed: 0'], axis = 1, inplace = True)
    # calculate correlation matrix
    stock_corr_matrix = price_matrix.corr()
    print(stock_corr_matrix)
    # plot the correlation matrix
    plot_corr_matrix(stock_corr_matrix)
    
    # create dendrogram and forced distance graph 
    threshold = 0.6
    stock_dist_matrix = 1 - stock_corr_matrix
    stock_map = dict(zip(range(len(stock_dist_matrix)), stock_dist_matrix.columns))
    cluster_group = plot_dendrogram(stock_dist_matrix, stock_map, threshold)
    # convert to force direct json
    convert_force_direct_json(stock_dist_matrix, cluster_group, stock_map, threshold)