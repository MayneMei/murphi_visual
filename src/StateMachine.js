import React, { useEffect, useRef } from "react";
import * as d3 from "d3";

const StateMachine = ({ states, transitions }) => {
  const ref = useRef();

  useEffect(() => {
    const svg = d3.select(ref.current);
    const width = 1200; // 增大宽度
    const height = 800; // 增大高度

    const nodes = states.map(state => ({
      id: state.sender,
      label: state.sender
    }));

    const links = transitions.map(transition => ({
      source: transition.from,
      target: transition.to
    }));

    const link = svg
      .selectAll(".link")
      .data(links)
      .enter()
      .append("line")
      .attr("class", "link")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6);

    const node = svg
      .selectAll(".node")
      .data(nodes)
      .enter()
      .append("circle")
      .attr("class", "node")
      .attr("r", 20)
      .attr("fill", "#69b3a2");

    const label = svg
      .selectAll(".label")
      .data(nodes)
      .enter()
      .append("text")
      .attr("class", "label")
      .text(d => d.label);

    const simulation = d3
      .forceSimulation(nodes)
      .force("link", d3.forceLink(links).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-500))
      .force("center", d3.forceCenter(width / 2, height / 2));

    simulation.on("tick", () => {
      link
        .attr("x1", d => d.source.x)
        .attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x)
        .attr("y2", d => d.target.y);

      node.attr("cx", d => d.x).attr("cy", d => d.y);

      label.attr("x", d => d.x).attr("y", d => d.y - 25); // 调整标签位置，使其位于节点上方
    });
  }, [states, transitions]);

  return <svg ref={ref} width={1200} height={800} />; // 调整SVG的大小
};

export default StateMachine;
